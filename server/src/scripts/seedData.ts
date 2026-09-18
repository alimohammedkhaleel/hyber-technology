import fs from 'fs';
import path from 'path';
import { query, getClient } from '../config/database';

async function run() {
  console.log('===[ Seeding Hyper Technology Store Sample Data ]===');
  const seedPath = path.resolve(__dirname, '../../../database/seeds/005_hyper_technology_sample_data.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Seeding error:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }

  // Check counts
  const catCount = await query('SELECT COUNT(*) FROM categories_new');
  const prodCount = await query('SELECT COUNT(*) FROM products_new');
  const slideCount = await query('SELECT COUNT(*) FROM carousel_slides');

  console.log(`Categories: ${catCount.rows[0].count}`);
  console.log(`Products: ${prodCount.rows[0].count}`);
  console.log(`Slides: ${slideCount.rows[0].count}`);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
