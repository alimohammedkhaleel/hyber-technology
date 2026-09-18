import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return sendError(res, 'يجب تسجيل الدخول لمتابعة هذا الإجراء', 401, 'UNAUTHORIZED');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      phone: payload.phone,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
    next();
  } catch (err: any) {
    return sendError(res, 'انتهت صلاحية رمز الدخول أو الرمز غير صالح', 401, 'TOKEN_INVALID');
  }
};

export const authenticate = authenticateToken;
