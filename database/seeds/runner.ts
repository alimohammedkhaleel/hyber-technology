import fs from 'fs';
import path from 'path';
import { getDatabasePool } from '../../server/src/config/database';

export async function runSeeds() {
  console.log('===[ PostgreSQL / Neon Seed Runner ]===');
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    const seedsDir = path.resolve(__dirname);
    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`[SEEDING] Executing ${file}...`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`[SUCCESS] Seed ${file} executed successfully.`);
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
      console.log('All seeds completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    });
}
