import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAuditEvent } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required to delete submissions' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare(`
      SELECT s.*, p.participant_id, p.full_name 
      FROM submissions s 
      JOIN participants p ON p.id = s.participant_id 
      WHERE s.id = ?
    `).get(id) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM submissions WHERE id = ?').run(id);

    logAuditEvent(
      db,
      'DELETE_SUBMISSION',
      `Admin deleted submission "${existing.project_name}" of participant ${existing.participant_id} (${existing.full_name})`,
      session.user.full_name || session.user.email
    );

    return NextResponse.json({
      success: true,
      message: `Submission "${existing.project_name}" for ${existing.participant_id} deleted successfully.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete submission' }, { status: 500 });
  }
}
