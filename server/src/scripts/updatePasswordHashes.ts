import { query } from '../config/database';
import { hashPassword } from '../utils/password.util';

async function fixSeedPasswords() {
  const realHash = await hashPassword('Password123!');
  console.log('Generated real bcrypt hash for Password123!:', realHash);

  await query('UPDATE users SET password_hash = $1', [realHash]);
  console.log('All users updated to Password123!');
  process.exit(0);
}

fixSeedPasswords().catch(console.error);
