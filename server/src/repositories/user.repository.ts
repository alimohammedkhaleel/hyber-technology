import { query, getClient } from '../config/database';
import { UserRole } from '../types/roles';

export interface UserRecord {
  id: string;
  email?: string;
  phone: string;
  password_hash: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileWithRoles extends UserRecord {
  full_name?: string;
  roles: UserRole[];
  permissions: string[];
}

export class UserRepository {
  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<UserRecord | null> {
    const res = await query<UserRecord>(
      'SELECT id, email, phone, password_hash, status, created_at, updated_at FROM users WHERE phone = $1',
      [phone]
    );
    return res.rows[0] || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const res = await query<UserRecord>(
      'SELECT id, email, phone, password_hash, status, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0] || null;
  }

  /**
   * Find user by identifier (either email or phone number with normalization)
   */
  async findByIdentifier(identifier: string): Promise<UserRecord | null> {
    const clean = identifier.trim();
    const lower = clean.toLowerCase();

    // Prepare phone variants (e.g. 010... vs +2010...)
    const variants = new Set<string>();
    variants.add(clean);

    if (/^01[0125]\d{8}$/.test(clean)) {
      variants.add('+2' + clean);
      variants.add('2' + clean);
    } else if (/^\+201[0125]\d{8}$/.test(clean)) {
      variants.add(clean.substring(2));
      variants.add(clean.substring(1));
    } else if (/^201[0125]\d{8}$/.test(clean)) {
      variants.add('+' + clean);
      variants.add(clean.substring(1));
    }

    const phoneList = Array.from(variants);

    const res = await query<UserRecord>(
      `SELECT id, email, phone, password_hash, status, created_at, updated_at 
       FROM users 
       WHERE LOWER(email) = $1 OR phone = ANY($2::text[])`,
      [lower, phoneList]
    );
    return res.rows[0] || null;
  }

  /**
   * Ultra-fast single-query method to find user with all roles, permissions, and profile for instant login
   */
  async findByIdentifierWithRoles(identifier: string): Promise<UserProfileWithRoles | null> {
    const trimmed = identifier.trim();
    const lower = trimmed.toLowerCase();

    const variants = new Set<string>();
    variants.add(trimmed);
    const clean = trimmed.replace(/\s+/g, '');
    variants.add(clean);

    if (clean.startsWith('+20')) {
      variants.add(clean.substring(1));
      variants.add('0' + clean.substring(3));
    } else if (clean.startsWith('20') && clean.length > 10) {
      variants.add('+' + clean);
      variants.add('0' + clean.substring(2));
    } else if (clean.startsWith('01') && clean.length === 11) {
      variants.add('+2' + clean);
      variants.add('2' + clean);
    } else if (/^201[0125]\d{8}$/.test(clean)) {
      variants.add('+' + clean);
      variants.add(clean.substring(1));
    }

    const phoneList = Array.from(variants);

    const res = await query<any>(
      `SELECT u.id, u.email, u.phone, u.password_hash, u.status, u.created_at, u.updated_at,
              cp.full_name,
              COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
              COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE LOWER(u.email) = $1 OR u.phone = ANY($2::text[])
       GROUP BY u.id, cp.full_name`,
      [lower, phoneList]
    );

    if (!res.rows[0]) return null;
    const row = res.rows[0];

    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      password_hash: row.password_hash,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      full_name: row.full_name,
      roles: (row.roles || []) as UserRole[],
      permissions: row.permissions || [],
    };
  }

  /**
   * Find user by ID with attached roles and permissions
   */
  async findByIdWithRoles(userId: string): Promise<UserProfileWithRoles | null> {
    const userRes = await query<UserRecord>(
      'SELECT id, email, phone, password_hash, status, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (!userRes.rows[0]) return null;
    const user = userRes.rows[0];

    // Fetch roles
    const rolesRes = await query<{ code: UserRole }>(
      `SELECT r.code 
       FROM roles r 
       INNER JOIN user_roles ur ON ur.role_id = r.id 
       WHERE ur.user_id = $1`,
      [userId]
    );
    const roles = rolesRes.rows.map((r) => r.code);

    // Fetch permissions
    const permRes = await query<{ code: string }>(
      `SELECT DISTINCT p.code 
       FROM permissions p 
       INNER JOIN role_permissions rp ON rp.permission_id = p.id 
       INNER JOIN user_roles ur ON ur.role_id = rp.role_id 
       WHERE ur.user_id = $1`,
      [userId]
    );
    const permissions = permRes.rows.map((p) => p.code);

    // Fetch customer profile name if exists
    const profileRes = await query<{ full_name: string }>(
      'SELECT full_name FROM customer_profiles WHERE user_id = $1',
      [userId]
    );

    return {
      ...user,
      full_name: profileRes.rows[0]?.full_name,
      roles,
      permissions,
    };
  }

  /**
   * Create a new customer user and profile within a transaction
   */
  async createCustomer(data: {
    phone: string;
    email?: string;
    passwordHash: string;
    fullName: string;
  }): Promise<UserProfileWithRoles> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert user
      const userRes = await client.query<UserRecord>(
        `INSERT INTO users (phone, email, password_hash, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING id, email, phone, password_hash, status, created_at, updated_at`,
        [data.phone, data.email || null, data.passwordHash]
      );
      const newUser = userRes.rows[0];

      // 2. Assign default CUSTOMER role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE code = 'CUSTOMER'`,
        [newUser.id]
      );

      // 3. Create customer profile
      await client.query(
        `INSERT INTO customer_profiles (user_id, full_name, phone, email, account_status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')`,
        [newUser.id, data.fullName, data.phone, data.email || null]
      );

      await client.query('COMMIT');

      return {
        ...newUser,
        full_name: data.fullName,
        roles: [UserRole.CUSTOMER],
        permissions: [],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
