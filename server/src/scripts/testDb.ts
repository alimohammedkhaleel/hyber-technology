import { query } from '../config/database';

async function test() {
  console.log('Testing Neon connection...');
  const res = await query('SELECT NOW() as current_time, 1 as num');
  console.log('Connection SUCCESS:', res.rows[0]);
  process.exit(0);
}

test().catch(err => {
  console.error('Connection FAIL:', err);
  process.exit(1);
});
