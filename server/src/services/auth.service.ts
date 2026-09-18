import { UserRepository, UserProfileWithRoles } from '../repositories/user.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { hashPassword, comparePassword } from '../utils/password.util';
import { signAccessToken, signRefreshToken } from '../utils/jwt.util';

export interface RegisterDTO {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
  ipAddress?: string;
}

export interface LoginDTO {
  identifier?: string;
  phone?: string;
  email?: string;
  password: string;
  ipAddress?: string;
}

export interface AuthResult {
  user: {
    id: string;
    phone: string;
    email?: string;
    fullName?: string;
    roles: string[];
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  private userRepo: UserRepository;
  private auditRepo: AuditRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.auditRepo = new AuditRepository();
  }

  /**
   * Register a new customer in the real database
   */
  async registerCustomer(dto: RegisterDTO): Promise<AuthResult> {
    // 1. Check if phone is already registered
    const existingPhone = await this.userRepo.findByPhone(dto.phone);
    if (existingPhone) {
      throw new Error('رقم الهاتف مسجل بالفعل لدى مستخدم آخر.');
    }

    if (dto.email) {
      const existingEmail = await this.userRepo.findByEmail(dto.email);
      if (existingEmail) {
        throw new Error('البريد الإلكتروني مسجل بالفعل.');
      }
    }

    // 2. Hash password with bcrypt
    const passwordHash = await hashPassword(dto.password);

    // 3. Create user in PostgreSQL
    const createdUser = await this.userRepo.createCustomer({
      phone: dto.phone,
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    });

    // 4. Log audit event
    await this.auditRepo.log({
      actorId: createdUser.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: createdUser.id,
      metadata: { phone: dto.phone, role: 'CUSTOMER' },
      ipAddress: dto.ipAddress,
    });

    // 5. Generate tokens
    const accessToken = signAccessToken(createdUser);
    const refreshToken = signRefreshToken(createdUser.id);

    return {
      user: {
        id: createdUser.id,
        phone: createdUser.phone,
        email: createdUser.email,
        fullName: createdUser.full_name,
        roles: createdUser.roles,
        permissions: createdUser.permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Authenticate user credentials
   */
  async login(dto: LoginDTO): Promise<AuthResult> {
    const rawIdentifier = (dto.identifier || dto.email || dto.phone || '').trim();
    if (!rawIdentifier) {
      throw new Error('الرجاء إدخال البريد الإلكتروني أو رقم الهاتف.');
    }

    // 1. Single ultra-fast query retrieving user, roles, permissions and profile
    const user = await this.userRepo.findByIdentifierWithRoles(rawIdentifier);
    if (!user) {
      throw new Error('بيانات الدخول غير صحيحة (البريد الإلكتروني / رقم الهاتف أو كلمة المرور).');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('هذا الحساب معطل أو بانتظار التفعيل. يرجى التواصل مع الدعم.');
    }

    const isValidPassword = await comparePassword(dto.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('بيانات الدخول غير صحيحة (البريد الإلكتروني / رقم الهاتف أو كلمة المرور).');
    }

    // Non-blocking asynchronous audit logging to keep response time ultra-fast
    this.auditRepo.log({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: dto.ipAddress,
    }).catch((err) => {
      console.warn('[Audit Log Warning]:', err.message);
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        roles: user.roles,
        permissions: user.permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Get authenticated user profile details
   */
  async getProfile(userId: string): Promise<UserProfileWithRoles | null> {
    return this.userRepo.findByIdWithRoles(userId);
  }
}
