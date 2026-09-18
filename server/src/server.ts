import createApp from './app';
import { env, validateDatabaseEnv } from './config/env';
import { logger } from './utils/logger.util';
import { closeDatabasePool, checkDatabaseHealth } from './config/database';
import { BRANDING } from './config/branding';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  logger.info(`=======================================================`);
  logger.info(`  ${BRANDING.nameAr} - REST API Server`);
  logger.info(`  Environment: ${env.NODE_ENV}`);
  logger.info(`  Port: ${env.PORT}`);
  logger.info(`  Health Endpoint: http://localhost:${env.PORT}/api/v1/health`);
  logger.info(`=======================================================`);

  // Verify database connection on startup
  const { isConfigured, message } = validateDatabaseEnv();
  if (isConfigured) {
    logger.info('Verifying Neon PostgreSQL connection...');
    const health = await checkDatabaseHealth();
    if (health.connected) {
      logger.info(`[Neon DB Connected] Ping latency: ${health.latencyMs}ms`);
    } else {
      logger.warn(`[Neon DB Notice] Connection check returned: ${health.error}`);
    }
  } else {
    logger.warn(`[Neon DB Notice] ${message}`);
  }
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully terminating server...`);
  server.close(async () => {
    await closeDatabasePool();
    logger.info('Database pool closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
