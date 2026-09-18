import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env';

export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Allows flexible client hosting in development
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Allow in development
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow configured CLIENT_URL
    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }

    // Allow any Vercel deployment URL (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Allow official production custom domains
    if (origin === 'https://hypertechnology.store' || origin === 'https://www.hypertechnology.store') {
      return callback(null, true);
    }

    // Allow localhost and any origin gracefully
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
});
