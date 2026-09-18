import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedUser, UserRole } from '../types/roles';

export interface TokenPayload {
  userId: string;
  phone: string;
  email?: string;
  roles: UserRole[];
  permissions: string[];
}

export const signAccessToken = (user: AuthenticatedUser): string => {
  const payload: TokenPayload = {
    userId: user.id,
    phone: user.phone,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
};
