import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { SAMPLE_EXCEL_PATH, SAMPLE_CSV_PATH, generateSampleExcelFiles } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';

    if (!fs.existsSync(SAMPLE_EXCEL_PATH)) {
      generateSampleExcelFiles();
    }

    if (format === 'csv') {
      const csv = fs.readFileSync(SAMPLE_CSV_PATH);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="vibecode_sample_template.csv"'
        }
      });
    }

    const buffer = fs.readFileSync(SAMPLE_EXCEL_PATH);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="vibecode_sample_template.xlsx"'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
