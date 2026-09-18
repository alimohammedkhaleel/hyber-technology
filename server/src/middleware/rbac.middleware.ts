import { Request, Response, NextFunction } from 'express';
import { UserRole, PermissionCode } from '../types/roles';
import { sendError } from '../utils/response.util';

/**
 * Restricts route to specific user roles.
 * User must have AT LEAST ONE of the allowed roles.
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'يجب تسجيل الدخول أولاً', 401, 'UNAUTHORIZED');
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return sendError(
        res,
        'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء (Access Denied)',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};

/**
 * Restricts route to specific permission codes.
 */
export const requirePermissions = (...requiredPermissions: PermissionCode[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'يجب تسجيل الدخول أولاً', 401, 'UNAUTHORIZED');
    }

    // Admins automatically inherit all permissions
    if (req.user.roles.includes(UserRole.ADMIN)) {
      return next();
    }

    const hasPermission = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasPermission) {
      return sendError(
        res,
        'ليس لديك الإذن الكافي لتنفيذ هذه العملية',
        403,
        'PERMISSION_DENIED'
      );
    }

    next();
  };
};
