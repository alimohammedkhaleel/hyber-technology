import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';

const authService = new AuthService();

export class AuthController {
  /**
   * Register a new customer
   */
  async register(req: Request, res: Response) {
    try {
      const { fullName, phone, password, email } = req.body;

      if (!fullName || !phone || !password) {
        return sendError(
          res,
          'الرجاء إدخال كافة البيانات الإلزامية (الاسم بالكامل، رقم الهاتف، كلمة المرور)',
          400,
          'VALIDATION_ERROR'
        );
      }

      if (password.length < 6) {
        return sendError(res, 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام', 400, 'PASSWORD_TOO_SHORT');
      }

      const result = await authService.registerCustomer({
        fullName,
        phone,
        password,
        email,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      return sendSuccess(res, result, 'تم إنشاء الحساب بنجاح', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'REGISTRATION_FAILED');
    }
  }

  /**
   * Login with email or phone and password
   */
  async login(req: Request, res: Response) {
    try {
      const { phone, email, identifier, password } = req.body;
      const loginIdentifier = (identifier || email || phone || '').trim();

      if (!loginIdentifier || !password) {
        return sendError(
          res,
          'الرجاء إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور',
          400,
          'VALIDATION_ERROR'
        );
      }

      const result = await authService.login({
        identifier: loginIdentifier,
        phone: phone || loginIdentifier,
        email: email || (loginIdentifier.includes('@') ? loginIdentifier : undefined),
        password,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      return sendSuccess(res, result, 'تم تسجيل الدخول بنجاح');
    } catch (err: any) {
      return sendError(res, err.message, 401, 'AUTHENTICATION_FAILED');
    }
  }

  /**
   * Get current authenticated user profile
   */
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'غير مصرح', 401, 'UNAUTHORIZED');
      }

      const profile = await authService.getProfile(req.user.id);
      if (!profile) {
        return sendError(res, 'المستخدم غير موجود', 404, 'USER_NOT_FOUND');
      }

      const safeProfile = {
        id: profile.id,
        phone: profile.phone,
        email: profile.email,
        fullName: profile.full_name,
        status: profile.status,
        roles: profile.roles,
        permissions: profile.permissions,
        createdAt: profile.created_at,
      };

      return sendSuccess(res, safeProfile);
    } catch (err: any) {
      return sendError(res, err.message, 500, 'PROFILE_FETCH_FAILED');
    }
  }
}
