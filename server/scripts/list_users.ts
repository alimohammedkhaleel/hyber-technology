import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT 
        u.id, 
        u.phone, 
        u.email, 
        u.status, 
        r.code as role, 
        cp.full_name, 
        v.name as vendor_name,
        v.id as vendor_id,
        v.service_type
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      LEFT JOIN vendors v ON v.user_id = u.id
      ORDER BY u.created_at ASC
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
