import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * In-memory sliding window rate limiter
 * @param windowMs Time window in milliseconds (default 15 minutes)
 * @param max Max allowed requests within the window
 * @param message Custom error message
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 15,
  message: string = 'تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار والمحاولة لاحقاً.'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= max) {
      const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
      return sendError(
        res,
        `${message} (${remainingSeconds} ثانية متبقية)`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    record.count += 1;
    next();
  };
};

export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 10, 'عدد محاولات تسجيل الدخول كثيرة جداً.');
