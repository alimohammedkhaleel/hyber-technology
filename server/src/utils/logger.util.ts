/**
 * Production-Safe Logger Utility
 * Filters out passwords, tokens, and payment secrets before printing.
 */

const SENSITIVE_KEYS = ['password', 'password_hash', 'token', 'secret', 'key', 'hmac', 'card_number', 'cvv'];

const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      clean[key] = sanitizeData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export const logger = {
  info: (message: string, context?: any) => {
    const timestamp = new Date().toISOString();
    if (context) {
      console.log(`[INFO] [${timestamp}] ${message}`, JSON.stringify(sanitizeData(context)));
    } else {
      console.log(`[INFO] [${timestamp}] ${message}`);
    }
  },
  warn: (message: string, context?: any) => {
    const timestamp = new Date().toISOString();
    if (context) {
      console.warn(`[WARN] [${timestamp}] ${message}`, JSON.stringify(sanitizeData(context)));
    } else {
      console.warn(`[WARN] [${timestamp}] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errMessage = error instanceof Error ? error.message : error;
    console.error(`[ERROR] [${timestamp}] ${message}`, errMessage || '');
  },
};
