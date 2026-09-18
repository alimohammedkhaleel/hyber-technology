/**
 * System Roles and Permission Types
 * Hyper Technology Store - Strict RBAC
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export type PermissionCode =
  | 'system:manage'
  | 'audit:view'
  | 'users:read'
  | 'users:write'
  | 'products:manage'
  | 'categories:manage'
  | 'carousel:manage'
  | 'orders:view_all'
  | 'orders:manage'
  | 'payments:verify'
  | 'exchange_rate:manage'
  | 'settings:manage';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  phone: string;
  roles: UserRole[];
  permissions: string[];
}
