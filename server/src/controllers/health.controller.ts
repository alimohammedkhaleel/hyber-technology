import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { sendSuccess } from '../utils/response.util';
import { BRANDING } from '../config/branding';

export class HealthController {
  async getHealth(_req: Request, res: Response) {
    const dbStatus = await checkDatabaseHealth();

    const healthData = {
      status: 'ONLINE',
      platform: BRANDING.shortName,
      version: BRANDING.version,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        engine: 'PostgreSQL (Neon)',
        connected: dbStatus.connected,
        latencyMs: dbStatus.latencyMs,
        error: dbStatus.error,
      },
      environment: process.env.NODE_ENV || 'development',
    };

    return sendSuccess(res, healthData, 'System operational');
  }
}
