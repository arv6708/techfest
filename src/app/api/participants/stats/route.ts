import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb();

    // 1. Total Registered
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM participants').get() as any;
    const totalRegistered = totalRow.count;

    // 2. Today's Registrations (current calendar date)
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRow = db.prepare("SELECT COUNT(*) as count FROM participants WHERE registration_date LIKE ? OR created_at LIKE ?").get(`${todayStr}%`, `${todayStr}%`) as any;
    const todayRegistrations = todayRow.count;

    // 3. Paid & Pending
    const paidRow = db.prepare("SELECT COUNT(*) as count FROM participants WHERE payment_status = 'PAID'").get() as any;
    const pendingRow = db.prepare("SELECT COUNT(*) as count FROM participants WHERE payment_status = 'PENDING'").get() as any;
    const paidCount = paidRow.count;
    const pendingCount = pendingRow.count;

    // 4. Submissions
    const submissionsRow = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'SUBMITTED'").get() as any;
    const submissionsCount = submissionsRow.count;

    // 5. Distinct Colleges
    const collegesRow = db.prepare("SELECT COUNT(DISTINCT TRIM(LOWER(college))) as count FROM participants").get() as any;
    const collegesCount = collegesRow.count;

    // 6. Recent 5 registrations (useful for live polling notification toast)
    const recentRows = db.prepare(`
      SELECT participant_id, full_name, college, registration_source, created_at
      FROM participants
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as any[];

    // 7. Top Colleges Breakdown for analytics
    const collegeBreakdown = db.prepare(`
      SELECT college, COUNT(*) as count 
      FROM participants 
      GROUP BY college 
      ORDER BY count DESC 
      LIMIT 6
    `).all() as any[];

    // 8. Registration Source Breakdown
    const sourceBreakdown = db.prepare(`
      SELECT registration_source, COUNT(*) as count 
      FROM participants 
      GROUP BY registration_source
    `).all() as any[];

    return NextResponse.json({
      totalRegistered,
      todayRegistrations,
      paidCount,
      pendingCount,
      submissionsCount,
      collegesCount,
      recentRegistrations: recentRows,
      collegeBreakdown,
      sourceBreakdown,
      timestamp: Date.now()
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
