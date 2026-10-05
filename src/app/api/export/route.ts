import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDb, parseParticipantRow } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const search = searchParams.get('search')?.trim() || '';
    const payment = searchParams.get('payment') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const source = searchParams.get('source') || 'ALL';

    const db = getDb();

    if (type === 'submissions') {
      // Export submissions joined with participant
      const sql = `
        SELECT 
          s.project_name as "Project Name",
          s.status as "Submission Status",
          s.submitted_at as "Submitted At",
          p.participant_id as "Participant ID",
          p.full_name as "Participant Name",
          p.email as "Email",
          p.phone as "Phone",
          p.college as "College",
          s.github_url as "GitHub Repository",
          s.live_website_url as "Live Website URL",
          s.demo_video_url as "Demo Video URL",
          s.technologies_used as "Technologies Used",
          s.ai_tools_used as "AI Tools Disclosed",
          s.ai_usage_description as "AI Usage Details",
          s.project_description as "Project Description",
          s.key_features as "Key Features"
        FROM submissions s
        JOIN participants p ON p.id = s.participant_id
        ORDER BY s.submitted_at DESC
      `;
      const rows = db.prepare(sql).all();

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

      const dateStr = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="vibecode_submissions_${dateStr}.csv"`
          }
        });
      } else {
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="vibecode_submissions_${dateStr}.xlsx"`
          }
        });
      }
    }

    // Export Participants
    const conditions: string[] = [];
    const params: any[] = [];

    if (type === 'paid') {
      conditions.push("p.payment_status = 'PAID'");
    } else if (type === 'pending') {
      conditions.push("p.payment_status = 'PENDING'");
    }

    if (search) {
      conditions.push(`(
        p.full_name LIKE ? OR 
        p.participant_id LIKE ? OR 
        p.email LIKE ? OR 
        p.phone LIKE ? OR 
        p.college LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT p.*, s.status as submission_status, s.project_name
      FROM participants p
      LEFT JOIN submissions s ON s.participant_id = p.id
      ${whereClause}
      ORDER BY p.participant_id ASC
    `;

    const rawRows = db.prepare(sql).all(...params) as any[];

    // Flatten rows and expand custom_fields as individual columns
    const exportRows = rawRows.map(row => {
      const p = parseParticipantRow(row);
      const flat: Record<string, any> = {
        'Participant ID': p.participant_id,
        'Full Name': p.full_name,
        'Email Address': p.email,
        'Phone Number': p.phone,
        'College / Institution': p.college,
        'Course / Department': p.course,
        'State': p.state,
        'District': p.district,
        'Payment Status': p.payment_status,
        'Payment Reference': p.payment_reference || '',
        'Registration Source': p.registration_source,
        'Registration Date': p.registration_date,
        'Participant Status': p.status,
        'Submission Status': row.submission_status || 'NOT_STARTED',
        'Project Name': row.project_name || ''
      };

      // Unpack custom fields
      if (p.custom_fields && typeof p.custom_fields === 'object') {
        Object.entries(p.custom_fields).forEach(([k, v]) => {
          flat[`Custom: ${k}`] = v;
        });
      }

      return flat;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

    const dateStr = new Date().toISOString().slice(0, 10);
    const filenamePrefix = type === 'paid' ? 'paid_participants' : type === 'pending' ? 'pending_participants' : 'all_participants';

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="vibecode_${filenamePrefix}_${dateStr}.csv"`
        }
      });
    } else {
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="vibecode_${filenamePrefix}_${dateStr}.xlsx"`
        }
      });
    }
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
