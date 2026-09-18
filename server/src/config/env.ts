import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file at root or server folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export interface ServerEnvironment {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CLIENT_URL: string;
  DATABASE_URL?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  PAYMOB_API_KEY?: string;
  PAYMOB_INTEGRATION_ID?: string;
  PAYMOB_IFRAME_ID?: string;
  PAYMOB_HMAC_SECRET?: string;
}

export const env: ServerEnvironment = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'nlp_superapp_secure_production_secret_key_2026_jwt_hash',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'nlp_superapp_secure_refresh_secret_key_2026_jwt_refresh',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  PAYMOB_API_KEY: process.env.PAYMOB_API_KEY,
  PAYMOB_INTEGRATION_ID: process.env.PAYMOB_INTEGRATION_ID,
  PAYMOB_IFRAME_ID: process.env.PAYMOB_IFRAME_ID,
  PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
};

export const validateDatabaseEnv = (): { isConfigured: boolean; message: string } => {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    return {
      isConfigured: false,
      message: 'DATABASE_URL is not set. Please supply a valid Neon PostgreSQL connection string in your .env file.',
    };
  }
  return {
    isConfigured: true,
    message: 'DATABASE_URL is configured.',
  };
};
