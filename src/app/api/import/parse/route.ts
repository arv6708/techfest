import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read with SheetJS
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetNames = workbook.SheetNames;

    if (!sheetNames || sheetNames.length === 0) {
      return NextResponse.json({ error: 'The uploaded file contains no sheets' }, { status: 400 });
    }

    const sheetsData: Record<string, {
      columns: string[];
      totalRows: number;
      sampleRows: any[];
      allRows: any[];
      suggestedMapping: Record<string, string>;
    }> = {};

    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '', raw: false });
      
      // Collect all unique columns across all rows
      const columnSet = new Set<string>();
      rows.forEach(r => {
        Object.keys(r).forEach(k => {
          if (k && !k.startsWith('__EMPTY')) {
            columnSet.add(k.trim());
          }
        });
      });
      const columns = Array.from(columnSet);

      // Auto-detect suggested mapping
      const suggestedMapping: Record<string, string> = {};
      columns.forEach(col => {
        const lower = col.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (lower.includes('fullname') || lower === 'name' || lower.includes('participantname') || lower.includes('studentname')) {
          if (!suggestedMapping.full_name) suggestedMapping.full_name = col;
        } else if (lower.includes('email') || lower.includes('mail')) {
          if (!suggestedMapping.email) suggestedMapping.email = col;
        } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('whatsapp')) {
          if (!suggestedMapping.phone) suggestedMapping.phone = col;
        } else if (lower.includes('college') || lower.includes('institution') || lower.includes('campus') || lower.includes('university')) {
          if (!suggestedMapping.college) suggestedMapping.college = col;
        } else if (lower.includes('course') || lower.includes('branch') || lower.includes('department') || lower.includes('dept') || lower.includes('stream')) {
          if (!suggestedMapping.course) suggestedMapping.course = col;
        } else if (lower === 'state') {
          if (!suggestedMapping.state) suggestedMapping.state = col;
        } else if (lower === 'district') {
          if (!suggestedMapping.district) suggestedMapping.district = col;
        } else if (lower.includes('payment') || lower.includes('fee') || lower.includes('paid')) {
          if (!suggestedMapping.payment_status) suggestedMapping.payment_status = col;
        } else if (lower.includes('reference') || lower.includes('utr') || lower.includes('txn') || lower.includes('transaction')) {
          if (!suggestedMapping.payment_reference) suggestedMapping.payment_reference = col;
        } else if (
          lower === 'id' || 
          lower.includes('participantid') || 
          lower.includes('regid') || 
          lower.includes('regno') || 
          lower.includes('registrationno') || 
          lower.includes('registrationid') || 
          lower.includes('participantcode') || 
          lower.includes('ticketid')
        ) {
          if (!suggestedMapping.participant_id) suggestedMapping.participant_id = col;
        } else if (lower.includes('timestamp') || lower.includes('date') || lower.includes('registeredat')) {
          if (!suggestedMapping.registration_date) suggestedMapping.registration_date = col;
        }
      });

      sheetsData[name] = {
        columns,
        totalRows: rows.length,
        sampleRows: rows.slice(0, 5),
        allRows: rows,
        suggestedMapping
      };
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      sheetNames,
      sheetsData
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to parse Excel file' }, { status: 500 });
  }
}
