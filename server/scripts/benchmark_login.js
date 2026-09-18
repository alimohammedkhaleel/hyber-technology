const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function benchmark() {
  console.log('--- Benchmarking Login Steps ---');
  
  // Test 1: Initial query (cold connection)
  const t0 = Date.now();
  const q1 = await pool.query("SELECT id, phone, email, password_hash, status FROM users WHERE email = 'customer@superapp.com'");
  const t1 = Date.now();
  console.log(`1. Query findByIdentifier (remote DB): ${t1 - t0}ms`);
  const user = q1.rows[0];

  // Test 2: bcrypt compare
  const t2 = Date.now();
  const valid = await bcrypt.compare('Password123!', user.password_hash);
  const t3 = Date.now();
  console.log(`2. bcrypt.compare (JS CPU): ${t3 - t2}ms (valid: ${valid})`);

  // Test 3: findByIdWithRoles
  const t4 = Date.now();
  const q2 = await pool.query(`
    SELECT u.id, u.phone, u.email, u.status, u.created_at,
           cp.full_name,
           COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
           COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
    FROM users u
    LEFT JOIN customer_profiles cp ON cp.user_id = u.id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = $1
    GROUP BY u.id, cp.full_name
  `, [user.id]);
  const t5 = Date.now();
  console.log(`3. Query findByIdWithRoles (remote DB): ${t5 - t4}ms`);

  // Test 4: audit log insert
  const t6 = Date.now();
  await pool.query(`
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, ip_address)
    VALUES ($1, $2, $3, $4, $5)
  `, [user.id, 'USER_LOGIN', 'USER', user.id, '127.0.0.1']);
  const t7 = Date.now();
  console.log(`4. Audit log insert (remote DB): ${t7 - t6}ms`);

  console.log(`TOTAL Login Time: ${(t1 - t0) + (t3 - t2) + (t5 - t4) + (t7 - t6)}ms`);

  // Test 5: Single Combined Query benchmark!
  console.log('\n--- Benchmarking OPTIMIZED Single Query ---');
  const o0 = Date.now();
  const optRes = await pool.query(`
    SELECT u.id, u.phone, u.email, u.password_hash, u.status, u.created_at,
           COALESCE(cp.full_name, 'عميل') AS full_name,
           COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
           COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
    FROM users u
    LEFT JOIN customer_profiles cp ON cp.user_id = u.id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE u.email = 'customer@superapp.com' OR u.phone = 'customer@superapp.com'
    GROUP BY u.id, cp.full_name
  `);
  const o1 = Date.now();
  console.log(`Optimized Single Query: ${o1 - o0}ms`);
  const bcryptTime = t3 - t2;
  console.log(`Optimized Total (Single Query + bcrypt): ${(o1 - o0) + bcryptTime}ms vs Original ${(t1 - t0) + (t3 - t2) + (t5 - t4) + (t7 - t6)}ms`);

  await pool.end();
}

benchmark().catch(err => {
  console.error(err);
  pool.end();
});
