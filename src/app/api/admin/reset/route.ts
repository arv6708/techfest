import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAuditEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();

    db.exec(`
      DELETE FROM submissions;
      DELETE FROM participants;
      DELETE FROM import_history;
      DELETE FROM users WHERE role != 'ADMIN';
      UPDATE event_config SET 
        state = 'PRE_EVENT',
        start_time = '2026-10-07T10:30:00+05:30',
        end_time = '2026-10-07T12:00:00+05:30';
    `);

    // Ensure arbeon admin always exists
    const arbeonExists = db.prepare("SELECT id FROM users WHERE LOWER(email) = 'arbeon@tantra.vjec.ac.in' OR LOWER(full_name) = 'arbeon'").get();
    if (!arbeonExists) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('arbeon123', 10);
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, created_at, updated_at)
        VALUES ('usr_admin_arbeon', 'arbeon@tantra.vjec.ac.in', ?, 'ADMIN', 'arbeon', ?, ?)
      `).run(hash, now, now);
    }

    logAuditEvent(db, 'DATABASE_RESET', 'All participant records and submissions cleared. Ready for fresh Excel import.', 'Admin');

    const participantCount = (db.prepare('SELECT COUNT(*) as c FROM participants').get() as any).c;
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;

    return NextResponse.json({
      success: true,
      message: 'Database emptied successfully. Ready for initial Excel import.',
      participantCount,
      userCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
