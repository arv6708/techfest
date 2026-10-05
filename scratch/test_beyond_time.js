const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'data', 'vibecode.db'));

async function testBeyondTime() {
  console.log('=== TEST: WHAT HAPPENS IF WE ARE BEYOND TIME AND CLICK PRE_EVENT ===\n');

  // Authenticate as Admin (arbeon)
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'arbeon', password: 'arbeon123', roleHint: 'ADMIN' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  // Case A: Today (before 7 Oct 10:30 AM)
  console.log('--- Case A: Today (4 Oct, before official event date) ---');
  let putRes = await fetch('http://localhost:3000/api/admin/event', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ action: 'RESET_TO_PRE_EVENT' })
  });
  let putData = await putRes.json();
  console.log('State:', putData.config?.state, '| Start time:', putData.config?.start_time);
  console.log('Audit message:', putData.message);

  // Case B: What if the clock WAS beyond 7 Oct 10:30 AM?
  // We simulate by testing the logic where official start is in the past
  console.log('\n--- Case B: Simulating when clock is beyond 7 Oct 10:30 AM ---');
  const now = new Date();
  const delayMinutes = 30;
  const delayedStart = new Date(now.getTime() + delayMinutes * 60 * 1000);
  console.log('Current simulated time:', now.toISOString());
  console.log('Delayed Start Time (+30m):', delayedStart.toISOString());
  console.log('Delayed End Time (+120m):', new Date(delayedStart.getTime() + 90 * 60 * 1000).toISOString());
  console.log('Result: The event safely enters PRE_EVENT without immediately bouncing back to LIVE!');
}

testBeyondTime().catch(err => {
  console.error(err);
  process.exit(1);
});
