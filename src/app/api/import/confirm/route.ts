import { NextRequest, NextResponse } from 'next/server';
import { 
  getDb, 
  getBatchNextParticipantIds, 
  findDuplicateParticipant, 
  parseParticipantRow, 
  logAuditEvent,
  normalizeEmail,
  normalizePhone,
  normalizeParticipantId,
  normalizeName
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { PaymentStatus, RegistrationSource } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      rows,
      mapping,
      mode = 'ADD_NEW_ONLY',
      fileName = 'uploaded_file.xlsx',
      registrationSource = 'Excel Import'
    } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided to import' }, { status: 400 });
    }

    const db = getDb();
    const standardKeys = new Set(Object.values(mapping).filter(Boolean) as string[]);

    let addedCount = 0;
    let updatedCount = 0;
    let duplicateSkippedCount = 0;
    let invalidCount = 0;
    const errors: string[] = [];

    // Pre-calculate count of rows that will need auto-generated IDs
    // to allocate a contiguous block of unique sequential IDs
    const newItemsToInsert: any[] = [];
    const itemsToUpdate: any[] = [];

    // Temporary sets to avoid intra-batch collisions
    const seenBatchEmails = new Set<string>();
    const seenBatchCleanPhones = new Set<string>();
    const seenBatchLast10Phones = new Set<string>();
    const seenBatchParticipantIds = new Set<string>();
    const seenBatchNames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const fullName = mapping.full_name && rawRow[mapping.full_name] ? String(rawRow[mapping.full_name]).trim() : '';
      const email = mapping.email && rawRow[mapping.email] ? normalizeEmail(rawRow[mapping.email]) : '';
      const phone = mapping.phone && rawRow[mapping.phone] ? String(rawRow[mapping.phone]).trim() : '';

      if (!fullName || !email || !email.includes('@') || !phone) {
        invalidCount++;
        continue;
      }

      const college = mapping.college && rawRow[mapping.college] ? String(rawRow[mapping.college]).trim() : 'Vimal Jyothi Engineering College';
      const course = mapping.course && rawRow[mapping.course] ? String(rawRow[mapping.course]).trim() : 'Computer Science and Engineering';
      const state = mapping.state && rawRow[mapping.state] ? String(rawRow[mapping.state]).trim() : 'Kerala';
      const district = mapping.district && rawRow[mapping.district] ? String(rawRow[mapping.district]).trim() : 'Kannur';

      const rawPayment = mapping.payment_status && rawRow[mapping.payment_status]
        ? String(rawRow[mapping.payment_status]).trim().toUpperCase()
        : 'PENDING';
      const paymentStatus: PaymentStatus = rawPayment === 'PAID' || rawPayment === 'YES' || rawPayment === '1' ? 'PAID' : 'PENDING';

      const paymentReference = mapping.payment_reference && rawRow[mapping.payment_reference]
        ? String(rawRow[mapping.payment_reference]).trim()
        : null;

      const explicitParticipantId = mapping.participant_id && rawRow[mapping.participant_id]
        ? String(rawRow[mapping.participant_id]).trim()
        : null;

      const regDate = mapping.registration_date && rawRow[mapping.registration_date]
        ? String(rawRow[mapping.registration_date]).trim()
        : new Date().toISOString();

      // Unmapped columns into custom_fields
      const customFields: Record<string, any> = {};
      Object.keys(rawRow).forEach(k => {
        if (!k.startsWith('__EMPTY') && !standardKeys.has(k)) {
          customFields[k] = rawRow[k];
        }
      });

      const normPid = normalizeParticipantId(explicitParticipantId);
      const normPhone = normalizePhone(phone);
      const normNameVal = normalizeName(fullName);

      // Check duplicate against existing participants in database
      const dup = findDuplicateParticipant(db, {
        participant_id: explicitParticipantId || undefined,
        email,
        phone,
        full_name: fullName,
        college
      });

      // Check intra-batch duplicate
      const isBatchDuplicate = 
        (normPid && seenBatchParticipantIds.has(normPid)) ||
        (email && seenBatchEmails.has(email)) ||
        (normPhone.clean && (seenBatchCleanPhones.has(normPhone.clean) || (normPhone.last10.length === 10 && seenBatchLast10Phones.has(normPhone.last10)))) ||
        (normNameVal && normNameVal.length >= 3 && seenBatchNames.has(normNameVal));

      if (dup.match || isBatchDuplicate) {
        if (mode === 'UPDATE_EXISTING_ADD_NEW' && dup.match) {
          itemsToUpdate.push({
            existingId: dup.match.id,
            fullName,
            email,
            phone,
            college,
            course,
            state,
            district,
            paymentStatus,
            paymentReference: paymentReference || dup.match.payment_reference,
            customFields: { ...dup.match.custom_fields, ...customFields }
          });
        } else {
          // Never re-add once-added or duplicate participants!
          duplicateSkippedCount++;
        }
      } else {
        newItemsToInsert.push({
          explicitParticipantId,
          fullName,
          email,
          phone,
          college,
          course,
          state,
          district,
          paymentStatus,
          paymentReference,
          registrationDate: regDate,
          customFields
        });

        // Record in batch tracking
        if (normPid) seenBatchParticipantIds.add(normPid);
        if (email) seenBatchEmails.add(email);
        if (normPhone.clean) {
          seenBatchCleanPhones.add(normPhone.clean);
          if (normPhone.last10.length === 10) seenBatchLast10Phones.add(normPhone.last10);
        }
        if (normNameVal) seenBatchNames.add(normNameVal);
      }
    }

    // Allocate batch sequential IDs for items that do not have explicitParticipantId
    const countNeedingIds = newItemsToInsert.filter(item => !item.explicitParticipantId).length;
    const generatedIds = countNeedingIds > 0 ? getBatchNextParticipantIds(db, countNeedingIds) : [];
    let idIndex = 0;

    // Execute atomic transaction
    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO participants (
        id, participant_id, user_id, full_name, email, phone, college, course,
        state, district, payment_status, payment_reference, registration_source,
        registration_date, status, custom_fields, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED', ?, ?, ?)
    `);

    const updateStmt = db.prepare(`
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
        custom_fields = ?,
        updated_at = ?
      WHERE id = ?
    `);

    const executeImportTx = db.transaction(() => {
      // 1. Insert new (with secondary database check to absolutely guarantee no duplicates)
      for (const item of newItemsToInsert) {
        const pId = item.explicitParticipantId || generatedIds[idIndex++];

        // Double check against DB right before inserting
        const doubleCheck = findDuplicateParticipant(db, {
          participant_id: pId,
          email: item.email,
          phone: item.phone,
          full_name: item.fullName,
          college: item.college
        });

        if (doubleCheck.match) {
          // Already in database: DO NOT INSERT!
          duplicateSkippedCount++;
          continue;
        }

        const id = 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        insertStmt.run(
          id,
          pId,
          item.fullName,
          item.email,
          item.phone,
          item.college,
          item.course,
          item.state,
          item.district,
          item.paymentStatus,
          item.paymentReference,
          registrationSource as RegistrationSource,
          item.registrationDate,
          JSON.stringify(item.customFields || {}),
          now,
          now
        );
        addedCount++;
      }

      // 2. Update existing if mode enabled
      for (const item of itemsToUpdate) {
        updateStmt.run(
          item.fullName,
          item.email,
          item.phone,
          item.college,
          item.course,
          item.state,
          item.district,
          item.paymentStatus,
          item.paymentReference,
          JSON.stringify(item.customFields || {}),
          now,
          item.existingId
        );
        updatedCount++;
      }

      // 3. Record in import history
      const historyId = 'imp_' + Date.now();
      db.prepare(`
        INSERT INTO import_history (
          id, file_name, imported_by, date, rows_processed, rows_added, rows_updated, duplicates, invalid_rows, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        historyId,
        fileName,
        admin.full_name || admin.email,
        now,
        rows.length,
        addedCount,
        updatedCount,
        duplicateSkippedCount,
        invalidCount,
        JSON.stringify({ mode, registrationSource, sampleErrors: errors.slice(0, 5) })
      );

      // 4. Audit log
      logAuditEvent(
        db,
        'EXCEL_IMPORT',
        `Imported ${fileName}: ${addedCount} added, ${updatedCount} updated, ${duplicateSkippedCount} skipped duplicates, ${invalidCount} invalid`,
        admin.full_name || admin.email
      );
    });

    executeImportTx();

    return NextResponse.json({
      success: true,
      message: `Import complete: ${addedCount} added, ${updatedCount} updated, ${duplicateSkippedCount} skipped.`,
      summary: {
        totalProcessed: rows.length,
        rowsAdded: addedCount,
        rowsUpdated: updatedCount,
        duplicatesSkipped: duplicateSkippedCount,
        invalidRows: invalidCount
      }
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Import execution failed' }, { status: 500 });
  }
}
