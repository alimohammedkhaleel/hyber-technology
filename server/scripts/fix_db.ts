import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
  const client = await pool.connect();
  try {
    console.log('Applying DB Schema updates...');
    
    // Add rating to vendors
    await client.query(`
      ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.00;
    `);
    console.log('✓ Added rating column to vendors.');

    // Update reviews status check constraint
    await client.query(`
      ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
      ALTER TABLE reviews ADD CONSTRAINT reviews_status_check 
        CHECK (status IN ('APPROVED', 'PUBLISHED', 'HIDDEN', 'REPORTED', 'FLAGGED'));
    `);
    console.log('✓ Updated reviews status check constraint.');

    // Add promo_code to orders if needed
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00;
    `);
    console.log('✓ Updated orders table with promo fields.');

    console.log('All DB fixes applied successfully!');
  } catch (err) {
    console.error('Error applying DB fix:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
