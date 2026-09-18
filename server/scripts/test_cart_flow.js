const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Testing DB connection...');
  const t0 = Date.now();
  const userRes = await pool.query("SELECT id, phone, email FROM users WHERE email = 'customer@superapp.com'");
  console.log(`User query took ${Date.now() - t0}ms:`, userRes.rows[0]);

  const customerId = userRes.rows[0].id;
  const profileRes = await pool.query("SELECT * FROM customer_profiles WHERE user_id = $1", [customerId]);
  console.log('Customer profile:', profileRes.rows);

  const productRes = await pool.query(`
    SELECT p.id, p.name, p.vendor_id, p.base_price, p.is_available, v.name as vendor_name
    FROM products p
    JOIN vendors v ON v.id = p.vendor_id
    LIMIT 3
  `);
  console.log('Sample products:', productRes.rows);

  // Check product addons for sample product
  if (productRes.rows.length > 0) {
    const p0 = productRes.rows[0];
    const addonsRes = await pool.query("SELECT * FROM product_addons WHERE product_id = $1", [p0.id]);
    console.log('Addons for product 0:', addonsRes.rows);

    const variantsRes = await pool.query("SELECT * FROM product_variants WHERE product_id = $1", [p0.id]);
    console.log('Variants for product 0:', variantsRes.rows);
  }

  // Check carts table
  const cartsRes = await pool.query("SELECT * FROM carts");
  console.log('Carts in DB:', cartsRes.rows);

  // Check cart_items table
  const cartItemsRes = await pool.query("SELECT * FROM cart_items");
  console.log('Cart items in DB:', cartItemsRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  pool.end();
});
