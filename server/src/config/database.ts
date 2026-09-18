import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env, validateDatabaseEnv } from './env';

let pool: Pool | null = null;

/**
 * Creates and returns the PostgreSQL Connection Pool configured for Neon.
 */
export const getDatabasePool = (): Pool => {
  if (pool) {
    return pool;
  }

  const { isConfigured, message } = validateDatabaseEnv();
  if (!isConfigured || !env.DATABASE_URL) {
    throw new Error(`Database connection failed: ${message}`);
  }

  const isVercelServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  const poolConfig: PoolConfig = {
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL SSL handshakes
    },
    max: isVercelServerless ? 5 : 15, // Prevent connection exhaustion in serverless lambdas
    idleTimeoutMillis: isVercelServerless ? 20000 : 120000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]:', err.message);
  });

  return pool;
};

/**
 * Safe query executor wrapping pool query.
 */
export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const activePool = getDatabasePool();
  return activePool.query<T>(text, params);
};

/**
 * Get dedicated client from pool for transactions.
 */
export const getClient = async (): Promise<PoolClient> => {
  const activePool = getDatabasePool();
  return activePool.connect();
};

/**
 * Gracefully close database pool.
 */
export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

/**
 * Check database connection status and ping latency.
 */
export const checkDatabaseHealth = async (): Promise<{ connected: boolean; latencyMs?: number; error?: string }> => {
  const startTime = Date.now();
  try {
    const { isConfigured } = validateDatabaseEnv();
    if (!isConfigured) {
      return { connected: false, error: 'DATABASE_URL is not configured' };
    }
    const result = await query('SELECT 1 AS health_check');
    const latencyMs = Date.now() - startTime;
    return { connected: result.rows.length > 0, latencyMs };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
};
