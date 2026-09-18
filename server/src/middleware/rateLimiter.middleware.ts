import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter to protect authentication and payment endpoints.
 */
export const rateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
      return sendError(
        res,
        options.message || 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد قليل.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    record.count += 1;
    next();
  };
};
