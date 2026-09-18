import express, { Express, Request, Response } from 'express';
import { securityHeaders, corsMiddleware } from './middleware/security.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import v1Router from './routes/api/v1';
import { logger } from './utils/logger.util';
import { sendError, sendSuccess } from './utils/response.util';
import { BRANDING } from './config/branding';

import path from 'path';

const createApp = (): Express => {
  const app = express();

  // Basic security and parsing middlewares
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Request logger
  app.use((req: Request, _res: Response, next) => {
    logger.info(`--> ${req.method} ${req.url}`);
    next();
  });

  // Base index route
  app.get('/', (_req: Request, res: Response) => {
    return sendSuccess(res, {
      name: BRANDING.nameAr,
      englishName: BRANDING.nameEn,
      version: BRANDING.version,
      status: 'OPERATIONAL',
      apiDocs: '/api/v1/health',
    });
  });

  // Versioned API v1 Router
  app.use('/api/v1', v1Router);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    return sendError(
      res,
      `المسار المطلوب (${req.originalUrl}) غير موجود على هذا الخادم.`,
      404,
      'NOT_FOUND'
    );
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
