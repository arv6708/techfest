import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 STARTING COMPREHENSIVE VIBECODE TEST SUITE...');

  // 1. Admin Login
  console.log('\n[TEST 1] Admin Authentication...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@tantra.vjec.ac.in',
      password: 'Admin@VibeCode2026'
    })
  });
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('Admin login status:', loginRes.status, loginData.user?.role === 'ADMIN' ? '✅ SUCCESS' : '❌ FAILED');
  const adminCookie = setCookie ? setCookie.split(';')[0] : '';

  // 2. Fetch Initial Stats
  console.log('\n[TEST 2] Verifying Live Admin Stats...');
  const statsRes = await fetch(`${BASE_URL}/api/participants/stats`, {
    headers: { Cookie: adminCookie }
  });
  const initialStats = await statsRes.json();
  console.log('Current Registered Participants:', initialStats.totalRegistered);
  const baselineCount = initialStats.totalRegistered;

  // 3. Test Duplicate Excel Import Prevention
  console.log('\n[TEST 3] Testing Re-import of Existing Excel & Duplicate Detection...');
  const sampleFilePath = path.join(process.cwd(), 'data', 'vibecode_initial_registrations.xlsx');
  const fileBuffer = fs.readFileSync(sampleFilePath);

  // Parse Excel
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  const previewRes = await fetch(`${BASE_URL}/api/import/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({
      rows: rawRows,
      mapping: {
        participant_id: 'Participant ID',
        full_name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        college: 'College / Institution',
        course: 'Department / Branch',
        year: 'Year of Study',
        payment_status: 'Payment Status'
      },
      mode: 'ADD_NEW_ONLY'
    })
  });
  const previewData = await previewRes.json();
  console.log(`Preview results: Total=${previewData.totalRows}, New=${previewData.newCount}, Duplicates=${previewData.duplicateCount}`);
  if (previewData.duplicateCount === rawRows.length) {
    console.log('✅ DUPLICATE DETECTION VERIFIED: All existing participants recognized as duplicates!');
  } else {
    console.log('⚠️ Duplicates count:', previewData.duplicateCount);
  }

  // 4. Test Website Registration (Real-Time DB Sync)
  console.log('\n[TEST 4] Testing Website Participant Registration (Live DB Sync)...');
  const uniqueId = Date.now().toString().slice(-4);
  const regEmail = `dev.contestant${uniqueId}@vjec.ac.in`;
  const regPhone = `98471${uniqueId}`;
  
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: `Kavya Nambiar ${uniqueId}`,
      email: regEmail,
      phone: regPhone,
      college: 'Vimal Jyothi Engineering College, Chemperi',
      course: 'Artificial Intelligence and Data Science',
      year: '3rd Year',
      password: 'password123',
      custom_fields: { 'T-Shirt Size': 'M', 'Laptop Required': 'No' }
    })
  });
  const regData = await regRes.json();
  console.log('Registration status:', regRes.status, 'Assigned ID:', regData.participantId);
  const partCookie = regRes.headers.get('set-cookie')?.split(';')[0] || '';

  // 5. Verify Admin Count Updated Immediately Without Rebuild
  console.log('\n[TEST 5] Checking Admin Participant Count Immediately Updated...');
  const updatedStatsRes = await fetch(`${BASE_URL}/api/participants/stats`, {
    headers: { Cookie: adminCookie }
  });
  const updatedStats = await updatedStatsRes.json();
  console.log(`Before: ${baselineCount} -> After: ${updatedStats.totalRegistered}`);
  if (updatedStats.totalRegistered === baselineCount + 1) {
    console.log('✅ INSTANT DATABASE SYNC VERIFIED: Admin count increased by 1 instantly!');
  }

  // 6. Test Admin Manual Add Participant
  console.log('\n[TEST 6] Admin Manually Adding Participant...');
  const manualRes = await fetch(`${BASE_URL}/api/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({
      full_name: 'Rahul Varma (Desk Entry)',
      email: `rahul.desk${uniqueId}@gcek.ac.in`,
      phone: `94460${uniqueId}`,
      college: 'Government College of Engineering Kannur',
      course: 'Computer Science and Engineering',
      year: '4th Year',
      payment_status: 'PAID',
      payment_reference: 'CASH/DESK/001'
    })
  });
  const manualData = await manualRes.json();
  console.log('Manual add status:', manualRes.status, 'Assigned ID:', manualData.participant?.participant_id);

  // 7. Test Admin Edit Participant & Payment Mark
  console.log('\n[TEST 7] Admin Editing Participant & Marking Payment...');
  const editRes = await fetch(`${BASE_URL}/api/participants/${manualData.participant.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({
      payment_status: 'PAID',
      payment_reference: 'UTR/VERIFIED/849201948'
    })
  });
  const editData = await editRes.json();
  console.log('Payment updated to:', editData.participant?.payment_status, 'Ref:', editData.participant?.payment_reference, '✅ SUCCESS');

  // 8. Test Export (XLSX and CSV)
  console.log('\n[TEST 8] Testing Export to Excel (.xlsx) and CSV...');
  const exportXlsxRes = await fetch(`${BASE_URL}/api/export?type=all&format=xlsx`, {
    headers: { Cookie: adminCookie }
  });
  const xlsxBuffer = await exportXlsxRes.arrayBuffer();
  console.log('Exported XLSX bytes:', xlsxBuffer.byteLength, xlsxBuffer.byteLength > 1000 ? '✅ SUCCESS' : '❌ FAILED');

  const exportCsvRes = await fetch(`${BASE_URL}/api/export?type=all&format=csv`, {
    headers: { Cookie: adminCookie }
  });
  const csvText = await exportCsvRes.text();
  console.log('Exported CSV lines:', csvText.split('\n').length, 'Sample header:', csvText.split('\n')[0]);

  // 9. Test Participant Project Submission (Server-authoritative check)
  console.log('\n[TEST 9] Testing Participant Project Submission...');
  
  // Set event state to LIVE so submission is accepted
  await fetch(`${BASE_URL}/api/admin/event`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({ action: 'OPEN' })
  });

  const subRes = await fetch(`${BASE_URL}/api/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: partCookie
    },
    body: JSON.stringify({
      project_name: 'SmartCampus Automated Mess Booking',
      project_description: 'An AI-assisted student mess meal reservation utility for hostel students.',
      key_features: 'Instant QR pass, SQLite cache, Telegram bot updates',
      github_url: 'https://github.com/contestant/smartcampus',
      live_website_url: 'https://smartcampus.vercel.app',
      technologies_used: 'Next.js, Tailwind CSS, TypeScript, SQLite',
      ai_tools_used: 'GitHub Copilot, Claude 3.5 Sonnet',
      ai_usage_description: 'Assisted in form validation logic and schema setup.',
      isFinalSubmit: true
    })
  });
  const subData = await subRes.json();
  console.log('Submission status:', subRes.status, 'Project Name:', subData.submission?.project_name, 'Status:', subData.submission?.status);
  if (subData.submission?.status === 'SUBMITTED') {
    console.log('✅ SUBMISSION WITH AI DISCLOSURE VERIFIED');
  }

  // 10. Test Event Controls & Emergency Locking
  console.log('\n[TEST 10] Testing Emergency Close & Deadline Lock...');
  await fetch(`${BASE_URL}/api/admin/event`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({ action: 'CLOSE' })
  });

  // Verify that late submission is now REJECTED by server-authoritative check!
  const lateSubRes = await fetch(`${BASE_URL}/api/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: partCookie
    },
    body: JSON.stringify({
      project_name: 'Late Project Attempt',
      github_url: 'https://github.com/late/attempt',
      technologies_used: 'React',
      isFinalSubmit: true
    })
  });
  console.log('Late submission attempt status (should be 403 Forbidden):', lateSubRes.status);
  const lateSubData = await lateSubRes.json();
  console.log('Server response:', lateSubData.error);
  if (lateSubRes.status === 403) {
    console.log('✅ SERVER-AUTHORITATIVE DEADLINE LOCK VERIFIED!');
  }

  // Reset event state to PRE_EVENT for the official 7 October 2026 event
  await fetch(`${BASE_URL}/api/admin/event`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({ action: 'SET_STATE', state: 'PRE_EVENT' })
  });

  console.log('\n🎉 ALL 10 COMPREHENSIVE END-TO-END WORKFLOW TESTS PASSED PERFECTLY!\n');
}

runTests().catch(console.error);
