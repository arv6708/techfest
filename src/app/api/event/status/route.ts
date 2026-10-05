import { NextResponse } from 'next/server';
import { getDb, getEventConfigWithAutoTransition } from '@/lib/db';
import { EventConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const config = getEventConfigWithAutoTransition(db);

    if (!config) {
      return NextResponse.json({ error: 'Event config not initialized' }, { status: 500 });
    }

    const now = new Date();
    const serverTimestamp = now.getTime();
    const startTimeMs = new Date(config.start_time).getTime();
    const endTimeMs = new Date(config.end_time).getTime();

    const timeUntilStartMs = Math.max(0, startTimeMs - serverTimestamp);
    const timeRemainingMs = Math.max(0, endTimeMs - serverTimestamp);

    return NextResponse.json({
      serverTime: now.toISOString(),
      serverTimestamp,
      config,
      timeUntilStartMs,
      timeRemainingMs,
      isLive: config.state === 'LIVE',
      isClosed: config.state === 'SUBMISSION_CLOSED' || config.state === 'JUDGING' || config.state === 'RESULTS',
      durationMinutes: config.duration_minutes
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
