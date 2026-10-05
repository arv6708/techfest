import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAuditEvent, getEventConfigWithAutoTransition } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { EventConfig, EventState } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb();

    const config = getEventConfigWithAutoTransition(db);
    const logs = db.prepare(`
      SELECT * FROM event_audit_logs 
      ORDER BY timestamp DESC 
      LIMIT 30
    `).all();

    return NextResponse.json({
      config,
      auditLogs: logs,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const db = getDb();

    const currentConfig = db.prepare('SELECT * FROM event_config LIMIT 1').get() as EventConfig;
    if (!currentConfig) {
      return NextResponse.json({ error: 'Event config not found' }, { status: 404 });
    }

    const now = new Date();
    let newState: EventState = currentConfig.state;
    let newStartTime = currentConfig.start_time;
    let newEndTime = currentConfig.end_time;
    let newDuration = currentConfig.duration_minutes || 90;
    let auditAction = 'EVENT_CONFIG_UPDATE';
    let auditDetails = '';

    const { action, state, extendMinutes, start_time, end_time, venue, challenge_brief, fee, prize_pool } = body;

    if (action === 'OPEN') {
      newState = 'LIVE';
      newStartTime = now.toISOString();
      const end = new Date(now.getTime() + (currentConfig.duration_minutes || 90) * 60 * 1000);
      newEndTime = end.toISOString();
      newDuration = currentConfig.duration_minutes || 90;
      auditAction = 'EMERGENCY_OPEN';
      auditDetails = `Admin launched event LIVE. Timer set to ${newDuration} mins (until ${newEndTime}).`;
    } else if (action === 'CLOSE') {
      newState = 'SUBMISSION_CLOSED';
      newEndTime = now.toISOString();
      auditAction = 'EMERGENCY_CLOSE';
      auditDetails = `Admin emergency closed submissions. All future entries locked.`;
    } else if (action === 'EXTEND') {
      const minutesToAdd = parseInt(String(extendMinutes || '10'), 10);
      if (isNaN(minutesToAdd) || minutesToAdd <= 0) {
        return NextResponse.json({ error: 'Please specify a valid positive number of minutes to extend.' }, { status: 400 });
      }

      const currentEndMs = new Date(currentConfig.end_time).getTime();
      // If current end time has already passed (e.g. SUBMISSION_CLOSED), extend from NOW!
      const baseMs = Math.max(now.getTime(), currentEndMs);
      const extendedEnd = new Date(baseMs + minutesToAdd * 60 * 1000);
      newEndTime = extendedEnd.toISOString();
      
      // Ensure state is LIVE so participants can submit
      newState = 'LIVE';
      newDuration = Math.max(1, Math.round((extendedEnd.getTime() - new Date(newStartTime).getTime()) / (60 * 1000)));
      auditAction = 'EMERGENCY_EXTEND';
      auditDetails = `Admin extended competition deadline by +${minutesToAdd} minutes (New deadline: ${newEndTime}). Event is LIVE.`;
    } else if (action === 'SET_STATE' || action === 'RESET_TO_PRE_EVENT') {
      newState = (state || 'PRE_EVENT') as EventState;
      
      // If changing back to PRE_EVENT:
      if (newState === 'PRE_EVENT') {
        const officialStartMs = new Date('2026-10-07T10:30:00+05:30').getTime();
        
        // If current time is still before the official event date (e.g. before 7 Oct 10:30 AM IST):
        if (now.getTime() < officialStartMs) {
          newStartTime = '2026-10-07T10:30:00+05:30';
          newEndTime = '2026-10-07T12:00:00+05:30';
          newDuration = 90;
          auditDetails = `Admin reverted event state back to PRE_EVENT. Scheduled countdown reset to 7 Oct 2026, 10:30 AM IST.`;
        } else {
          // If current time is ALREADY BEYOND the official start time (e.g. event delayed, or post-event testing):
          // To maintain PRE_EVENT without auto-triggering LIVE, scheduled start time must be in the future relative to now!
          const delayMinutes = parseInt(String(body.delayMinutes || '30'), 10);
          const delayedStart = new Date(now.getTime() + delayMinutes * 60 * 1000);
          const delayedEnd = new Date(delayedStart.getTime() + 90 * 60 * 1000);
          
          newStartTime = body.start_time || delayedStart.toISOString();
          newEndTime = body.end_time || delayedEnd.toISOString();
          newDuration = 90;
          auditDetails = `Admin put event on hold in PRE_EVENT after scheduled time elapsed. Countdown set for +${delayMinutes} mins (Launch at ${newStartTime}).`;
        }
        auditAction = 'EVENT_RESET_PRE_EVENT';
      } else {
        auditAction = 'EVENT_STATE_CHANGE';
        auditDetails = `Admin transitioned event state from ${currentConfig.state} to ${newState}.`;
      }
    } else if (action === 'UPDATE_CONFIG') {
      newStartTime = start_time || currentConfig.start_time;
      newEndTime = end_time || currentConfig.end_time;
      newState = (state || currentConfig.state) as EventState;
      
      const startMs = new Date(newStartTime).getTime();
      const endMs = new Date(newEndTime).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        newDuration = Math.round((endMs - startMs) / (60 * 1000));
      }

      // If user extends deadline past now and event was closed, auto-reopen to LIVE
      if (endMs > now.getTime() && currentConfig.state === 'SUBMISSION_CLOSED') {
        newState = 'LIVE';
      }

      auditAction = 'EVENT_DETAILS_UPDATE';
      auditDetails = `Admin updated event schedule: ${newStartTime} to ${newEndTime} (State: ${newState}, Duration: ${newDuration}m)`;
    }

    db.prepare(`
      UPDATE event_config SET
        state = ?,
        start_time = ?,
        end_time = ?,
        duration_minutes = ?,
        venue = COALESCE(?, venue),
        challenge_brief = COALESCE(?, challenge_brief),
        fee = COALESCE(?, fee),
        prize_pool = COALESCE(?, prize_pool),
        updated_at = ?
      WHERE id = ?
    `).run(
      newState,
      newStartTime,
      newEndTime,
      newDuration,
      venue || null,
      challenge_brief || null,
      fee || null,
      prize_pool || null,
      now.toISOString(),
      currentConfig.id
    );

    logAuditEvent(db, auditAction, auditDetails, admin.full_name || admin.email);

    const updatedConfig = db.prepare('SELECT * FROM event_config LIMIT 1').get();

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      message: auditDetails || 'Event configuration updated successfully.'
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
