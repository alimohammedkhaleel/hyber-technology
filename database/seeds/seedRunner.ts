import fs from 'fs';
import path from 'path';
import { getDatabasePool } from '../../server/src/config/database';

export async function runSeeds() {
  console.log('===[ PostgreSQL / Neon Sample Data Seeder ]===');
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    const seedFile = path.resolve(__dirname, '005_hyper_technology_sample_data.sql');
    if (fs.existsSync(seedFile)) {
      console.log(`[SEEDING] Executing ${seedFile}...`);
      const sql = fs.readFileSync(seedFile, 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('[SUCCESS] Sample electronics data seeded successfully.');
    }
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[SEED ERROR]', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
