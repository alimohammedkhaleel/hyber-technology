import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { sendError } from '../utils/response.util';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً.'
      : err.message || 'حدث خطأ في معالجة الطلب';

  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  return sendError(res, message, statusCode, errorCode);
};
