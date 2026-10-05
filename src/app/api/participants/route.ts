import { NextRequest, NextResponse } from 'next/server';
import { getDb, getNextParticipantId, findDuplicateParticipant, logAuditEvent, parseParticipantRow } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const payment = searchParams.get('payment') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const source = searchParams.get('source') || 'ALL';
    const submission = searchParams.get('submission') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'DESC').toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const db = getDb();

    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(`(
        p.full_name LIKE ? OR 
        p.participant_id LIKE ? OR 
        p.email LIKE ? OR 
        p.phone LIKE ? OR 
        p.college LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (payment !== 'ALL') {
      conditions.push('p.payment_status = ?');
      params.push(payment);
    }

    if (status !== 'ALL') {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (source !== 'ALL') {
      conditions.push('p.registration_source = ?');
      params.push(source);
    }

    if (submission === 'SUBMITTED') {
      conditions.push("s.status = 'SUBMITTED'");
    } else if (submission === 'NOT_SUBMITTED') {
      conditions.push("(s.status IS NULL OR s.status != 'SUBMITTED')");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSorts: Record<string, string> = {
      created_at: 'p.created_at',
      full_name: 'p.full_name',
      participant_id: 'p.participant_id',
      college: 'p.college',
      registration_date: 'p.registration_date',
      payment_status: 'p.payment_status'
    };
    const orderColumn = allowedSorts[sortBy] || 'p.created_at';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM participants p
      LEFT JOIN submissions s ON s.participant_id = p.id
      ${whereClause}
    `;
    const totalCount = (db.prepare(countSql).get(...params) as any).total;

    // Data query
    const dataSql = `
      SELECT p.*, s.status as submission_status, s.project_name, s.submitted_at
      FROM participants p
      LEFT JOIN submissions s ON s.participant_id = p.id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const rawRows = db.prepare(dataSql).all(...params, limit, offset) as any[];
    const participants = rawRows.map(row => {
      const parsed = parseParticipantRow(row);
      return {
        ...parsed,
        submission_status: row.submission_status || 'NOT_STARTED',
        project_name: row.project_name || null,
        submitted_at: row.submitted_at || null
      };
    });

    return NextResponse.json({
      participants,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      full_name,
      email,
      phone,
      college,
      course,
      state = 'Kerala',
      district = 'Kannur',
      payment_status = 'PENDING',
      payment_reference = null,
      status = 'REGISTERED',
      participant_id,
      custom_fields = {},
      allow_duplicate = false
    } = body;

    if (!full_name || !email || !phone || !college || !course) {
      return NextResponse.json(
        { error: 'Name, Email, Phone, College, and Course are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const db = getDb();

    // Check duplicate
    if (!allow_duplicate) {
      const dup = findDuplicateParticipant(db, {
        participant_id: participant_id ? participant_id.trim() : undefined,
        email: cleanEmail,
        phone: cleanPhone,
        full_name,
        college
      });

      if (dup.match) {
        return NextResponse.json(
          {
            isDuplicate: true,
            matchedBy: dup.matchedBy,
            existingRecord: dup.match,
            message: `A participant with this ${dup.matchedBy} already exists (${dup.match.participant_id} - ${dup.match.full_name}). Set allow_duplicate: true to override.`
          },
          { status: 409 }
        );
      }
    }

    const finalParticipantId = (participant_id && participant_id.trim().length > 0)
      ? participant_id.trim()
      : getNextParticipantId(db);

    const id = 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO participants (
        id, participant_id, user_id, full_name, email, phone, college, course,
        state, district, payment_status, payment_reference, registration_source,
        registration_date, status, custom_fields, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Manual Entry', ?, ?, ?, ?, ?)
    `).run(
      id,
      finalParticipantId,
      full_name.trim(),
      cleanEmail,
      cleanPhone,
      college.trim(),
      course.trim(),
      state.trim(),
      district.trim(),
      payment_status,
      payment_reference,
      now,
      status,
      JSON.stringify(custom_fields || {}),
      now,
      now
    );

    logAuditEvent(
      db,
      'MANUAL_ADD_PARTICIPANT',
      `Admin manually added participant ${full_name} (${finalParticipantId})`,
      admin.full_name || admin.email
    );

    const created = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);

    return NextResponse.json({
      success: true,
      participant: parseParticipantRow(created)
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
