import fs from 'fs';
import path from 'path';
import { getDatabasePool } from '../../server/src/config/database';

export async function runMigrations() {
  console.log('===[ PostgreSQL / Neon Migration Runner ]===');
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const checkRes = await client.query('SELECT 1 FROM _migrations WHERE filename = $1', [file]);
      if (checkRes.rowCount && checkRes.rowCount > 0) {
        console.log(`[SKIPPED] Migration ${file} already applied.`);
        continue;
      }

      console.log(`[APPLYING] Migration ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[SUCCESS] Migration ${file} applied successfully.`);
    }
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION ERROR]', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('All migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration execution failed:', err);
      process.exit(1);
    });
}
