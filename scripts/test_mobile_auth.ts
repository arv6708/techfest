import Database from 'better-sqlite3';

const BASE_URL = 'http://localhost:3000';

async function testMobileAuth() {
  const db = new Database('./data/vibecode.db');

  const testId = 'VB26-99999';
  const testEmail = 'mobile.auth.test@vjec.ac.in';
  const testPhone = '9847199999';
  const now = new Date().toISOString();

  // Insert a test participant
  db.prepare(`
    INSERT OR REPLACE INTO participants (
      id, participant_id, full_name, email, phone, college, course, year,
      state, district, payment_status, registration_source, registration_date, status, custom_fields, created_at, updated_at
    ) VALUES ('test_mobile_p', ?, 'Mobile Password Test User', ?, ?, 'Vimal Jyothi Engineering College', 'CSE', '3rd Year', 'Kerala', 'Kannur', 'PAID', 'Excel Import', ?, 'REGISTERED', '{}', ?, ?)
  `).run(testId, testEmail, testPhone, now, now, now);

  console.log('Inserted test participant with phone:', testPhone);

  // Test Case A: Login with Participant ID + Mobile Number as password
  const resA = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testId, password: testPhone })
  });
  const dataA = await resA.json();
  console.log('Test A (ID + Phone as password):', resA.status, dataA.success ? '✅ SUCCESS' : dataA.error);

  // Test Case B: Login with Email + Mobile Number as password
  const resB = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testEmail, password: testPhone })
  });
  const dataB = await resB.json();
  console.log('Test B (Email + Phone as password):', resB.status, dataB.success ? '✅ SUCCESS' : dataB.error);

  // Test Case C: Login with Phone Number as both Identifier AND Password
  const resC = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testPhone, password: testPhone })
  });
  const dataC = await resC.json();
  console.log('Test C (Phone as ID and Password):', resC.status, dataC.success ? '✅ SUCCESS' : dataC.error);

  // Test Case D: Wrong Password check
  const resD = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testId, password: 'wrongpassword' })
  });
  const dataD = await resD.json();
  console.log('Test D (Wrong password error):', resD.status, 'Message:', dataD.error);

  // Clean up test participant to keep DB clean
  db.prepare('DELETE FROM participants WHERE id = ?').run('test_mobile_p');
  db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
  console.log('Cleaned up test participant. Database remains completely clean!');
}

testMobileAuth().catch(console.error);
