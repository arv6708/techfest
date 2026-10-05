import { NextRequest, NextResponse } from 'next/server';
import { 
  getDb, 
  findDuplicateParticipant, 
  normalizeEmail, 
  normalizePhone, 
  normalizeParticipantId, 
  normalizeName,
  isSamePhone 
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ImportPreviewRow, PaymentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { rows, mapping, mode = 'ADD_NEW_ONLY' } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for preview' }, { status: 400 });
    }

    if (!mapping || !mapping.full_name || !mapping.email) {
      return NextResponse.json(
        { error: 'Column mapping for Full Name and Email is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const previewRows: ImportPreviewRow[] = [];
    let newCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    const missingFieldsMap: Record<string, number> = {};

    // Standard schema keys that have dedicated columns
    const standardKeys = new Set(Object.values(mapping).filter(Boolean) as string[]);

    // Cache seen in current batch to catch intra-sheet duplicates
    const seenBatchEmails = new Set<string>();
    const seenBatchCleanPhones = new Set<string>();
    const seenBatchLast10Phones = new Set<string>();
    const seenBatchParticipantIds = new Set<string>();
    const seenBatchNames = new Set<string>();

    for (let index = 0; index < rows.length; index++) {
      const rawRow = rows[index];
      const rowNumber = index + 1;
      const validationErrors: string[] = [];

      // Extract mapped fields
      const fullName = (mapping.full_name && rawRow[mapping.full_name] !== undefined)
        ? String(rawRow[mapping.full_name]).trim()
        : '';
      const email = (mapping.email && rawRow[mapping.email] !== undefined)
        ? normalizeEmail(rawRow[mapping.email])
        : '';
      const phone = (mapping.phone && rawRow[mapping.phone] !== undefined)
        ? String(rawRow[mapping.phone]).trim()
        : '';
      const college = (mapping.college && rawRow[mapping.college] !== undefined)
        ? String(rawRow[mapping.college]).trim()
        : 'Vimal Jyothi Engineering College';
      const course = (mapping.course && rawRow[mapping.course] !== undefined)
        ? String(rawRow[mapping.course]).trim()
        : 'Computer Science and Engineering';
      const state = (mapping.state && rawRow[mapping.state] !== undefined)
        ? String(rawRow[mapping.state]).trim()
        : 'Kerala';
      const district = (mapping.district && rawRow[mapping.district] !== undefined)
        ? String(rawRow[mapping.district]).trim()
        : 'Kannur';
      
      const rawPayment = (mapping.payment_status && rawRow[mapping.payment_status] !== undefined)
        ? String(rawRow[mapping.payment_status]).trim().toUpperCase()
        : 'PENDING';
      const paymentStatus: PaymentStatus = rawPayment === 'PAID' || rawPayment === 'YES' || rawPayment === '1' ? 'PAID' : 'PENDING';

      const paymentReference = (mapping.payment_reference && rawRow[mapping.payment_reference] !== undefined)
        ? String(rawRow[mapping.payment_reference]).trim()
        : '';

      const participantId = (mapping.participant_id && rawRow[mapping.participant_id] !== undefined)
        ? String(rawRow[mapping.participant_id]).trim()
        : undefined;

      const regDate = (mapping.registration_date && rawRow[mapping.registration_date] !== undefined)
        ? String(rawRow[mapping.registration_date]).trim()
        : undefined;

      // Extract unmapped columns to custom_fields
      const customFields: Record<string, any> = {};
      Object.keys(rawRow).forEach(key => {
        if (!key.startsWith('__EMPTY') && !standardKeys.has(key)) {
          customFields[key] = rawRow[key];
        }
      });

      // Validation
      if (!fullName) {
        validationErrors.push('Missing Full Name');
        missingFieldsMap['Full Name'] = (missingFieldsMap['Full Name'] || 0) + 1;
      }
      if (!email || !email.includes('@')) {
        validationErrors.push('Missing or invalid Email');
        missingFieldsMap['Email'] = (missingFieldsMap['Email'] || 0) + 1;
      }
      if (!phone) {
        validationErrors.push('Missing Phone Number');
        missingFieldsMap['Phone'] = (missingFieldsMap['Phone'] || 0) + 1;
      }

      let status: 'NEW' | 'DUPLICATE' | 'INVALID' = 'NEW';
      let existingRecord: any = undefined;
      let matchedBy: 'participant_id' | 'email' | 'phone' | 'full_name' | 'batch_duplicate' | undefined = undefined;

      if (validationErrors.length > 0) {
        status = 'INVALID';
        invalidCount++;
      } else {
        const normPid = normalizeParticipantId(participantId);
        const pNorm = normalizePhone(phone);
        const normNameVal = normalizeName(fullName);

        // 1. Check for duplicates in DB
        const dupCheck = findDuplicateParticipant(db, {
          participant_id: participantId,
          email,
          phone,
          full_name: fullName,
          college
        });

        // 2. Check for intra-batch duplicate
        let isBatchDup = false;
        let batchMatchedField: 'participant_id' | 'email' | 'phone' | 'full_name' | undefined = undefined;

        if (normPid && seenBatchParticipantIds.has(normPid)) {
          isBatchDup = true;
          batchMatchedField = 'participant_id';
        } else if (email && seenBatchEmails.has(email)) {
          isBatchDup = true;
          batchMatchedField = 'email';
        } else if (
          pNorm.clean && 
          (seenBatchCleanPhones.has(pNorm.clean) || (pNorm.last10.length === 10 && seenBatchLast10Phones.has(pNorm.last10)))
        ) {
          isBatchDup = true;
          batchMatchedField = 'phone';
        } else if (normNameVal && normNameVal.length >= 3 && seenBatchNames.has(normNameVal)) {
          isBatchDup = true;
          batchMatchedField = 'full_name';
        }

        if (dupCheck.match) {
          status = 'DUPLICATE';
          existingRecord = dupCheck.match;
          matchedBy = dupCheck.matchedBy;
          duplicateCount++;
        } else if (isBatchDup) {
          status = 'DUPLICATE';
          matchedBy = batchMatchedField || 'batch_duplicate';
          duplicateCount++;
        } else {
          status = 'NEW';
          newCount++;
        }

        // Record in batch cache
        if (normPid) seenBatchParticipantIds.add(normPid);
        if (email) seenBatchEmails.add(email);
        if (pNorm.clean) {
          seenBatchCleanPhones.add(pNorm.clean);
          if (pNorm.last10.length === 10) seenBatchLast10Phones.add(pNorm.last10);
        }
        if (normNameVal) seenBatchNames.add(normNameVal);
      }

      previewRows.push({
        rowNumber,
        rawData: rawRow,
        mappedData: {
          participant_id: participantId,
          full_name: fullName,
          email,
          phone,
          college,
          course,
          state,
          district,
          payment_status: paymentStatus,
          payment_reference: paymentReference || undefined,
          registration_date: regDate,
          custom_fields: customFields
        },
        status,
        existingRecord,
        validationErrors,
        matchedBy
      });
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      newCount,
      duplicateCount,
      invalidCount,
      missingFields: missingFieldsMap,
      mode,
      previewRows: previewRows.slice(0, 100), // First 100 for fast UI rendering
      allRowsLength: previewRows.length
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
