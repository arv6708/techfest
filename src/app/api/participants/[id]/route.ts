import { NextRequest, NextResponse } from 'next/server';
import { getDb, parseParticipantRow, logAuditEvent } from '@/lib/db';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const row = db.prepare(`
      SELECT * FROM participants 
      WHERE id = ? OR participant_id = ?
    `).get(id, id) as any;

    if (!row) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const participant = parseParticipantRow(row);

    // If regular participant, can only view their own profile
    if (session.user.role === 'PARTICIPANT') {
      if (participant.user_id !== session.user.id && participant.email.toLowerCase() !== session.user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get submission
    const submission = db.prepare('SELECT * FROM submissions WHERE participant_id = ?').get(participant.id) as any;

    // Get audit logs related to this participant
    const logs = db.prepare(`
      SELECT * FROM event_audit_logs 
      WHERE details LIKE ? OR details LIKE ?
      ORDER BY timestamp DESC
      LIMIT 20
    `).all(`%${participant.participant_id}%`, `%${participant.full_name}%`);

    return NextResponse.json({
      participant,
      submission: submission || null,
      history: logs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const db = getDb();
    const existing = db.prepare('SELECT * FROM participants WHERE id = ? OR participant_id = ?').get(id, id) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const parsedExisting = parseParticipantRow(existing);

    const {
      full_name = parsedExisting.full_name,
      email = parsedExisting.email,
      phone = parsedExisting.phone,
      college = parsedExisting.college,
      course = parsedExisting.course,
      state = parsedExisting.state,
      district = parsedExisting.district,
      payment_status = parsedExisting.payment_status,
      payment_reference = parsedExisting.payment_reference,
      status = parsedExisting.status,
      custom_fields = parsedExisting.custom_fields
    } = body;

    // Merge custom_fields to preserve existing unknown fields
    const mergedCustomFields = {
      ...parsedExisting.custom_fields,
      ...(custom_fields || {})
    };

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE participants SET
        full_name = ?,
        email = ?,
        phone = ?,
        college = ?,
        course = ?,
        state = ?,
        district = ?,
        payment_status = ?,
        payment_reference = ?,
        status = ?,
        custom_fields = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      full_name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      college.trim(),
      course.trim(),
      state.trim(),
      district.trim(),
      payment_status,
      payment_reference,
      status,
      JSON.stringify(mergedCustomFields),
      now,
      existing.id
    );

    logAuditEvent(
      db,
      'EDIT_PARTICIPANT',
      `Admin updated participant ${existing.participant_id} (${full_name})`,
      admin.full_name || admin.email
    );

    const updated = db.prepare('SELECT * FROM participants WHERE id = ?').get(existing.id);

    return NextResponse.json({
      success: true,
      participant: parseParticipantRow(updated)
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const db = getDb();
    const existing = db.prepare('SELECT * FROM participants WHERE id = ? OR participant_id = ?').get(id, id) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (body.payment_status) {
      const paymentStatus = body.payment_status.toUpperCase() === 'PAID' ? 'PAID' : 'PENDING';
      const paymentRef = body.payment_reference !== undefined ? body.payment_reference : existing.payment_reference;

      db.prepare(`
        UPDATE participants 
        SET payment_status = ?, payment_reference = ?, updated_at = ?
        WHERE id = ?
      `).run(paymentStatus, paymentRef, now, existing.id);

      logAuditEvent(
        db,
        'PAYMENT_STATUS_CHANGE',
        `Changed payment status for ${existing.participant_id} to ${paymentStatus} (Ref: ${paymentRef || 'N/A'})`,
        admin.full_name || admin.email
      );
    }

    if (body.status) {
      db.prepare(`
        UPDATE participants 
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(body.status, now, existing.id);

      logAuditEvent(
        db,
        'STATUS_CHANGE',
        `Changed participant status for ${existing.participant_id} to ${body.status}`,
        admin.full_name || admin.email
      );
    }

    const updated = db.prepare('SELECT * FROM participants WHERE id = ?').get(existing.id);

    return NextResponse.json({
      success: true,
      participant: parseParticipantRow(updated)
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const db = getDb();
    const existing = db.prepare('SELECT * FROM participants WHERE id = ? OR participant_id = ?').get(id, id) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM participants WHERE id = ?').run(existing.id);

    logAuditEvent(
      db,
      'DELETE_PARTICIPANT',
      `Deleted participant ${existing.participant_id} (${existing.full_name})`,
      admin.full_name || admin.email
    );

    return NextResponse.json({ success: true, message: 'Participant deleted successfully' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
