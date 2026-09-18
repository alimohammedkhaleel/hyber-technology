import { query } from '../config/database';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'ORDER' | 'BOOKING' | 'DELIVERY' | 'MODERATION' | 'SYSTEM' | 'PROMOTION';
  metadata?: any;
}

export class NotificationService {
  /**
   * Create a persisted notification for a specific user
   */
  static async create(params: CreateNotificationParams): Promise<void> {
    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, metadata, is_read)
         VALUES ($1, $2, $3, $4, $5, FALSE)`,
        [
          params.userId,
          params.title,
          params.message,
          params.type || 'SYSTEM',
          params.metadata ? JSON.stringify(params.metadata) : null,
        ]
      );
    } catch (err: any) {
      console.error('[NotificationService] Failed to create notification:', err.message);
    }
  }

  /**
   * Notify the vendor owner user
   */
  static async notifyVendor(vendorId: string, title: string, message: string, type: 'ORDER' | 'BOOKING' | 'MODERATION' = 'ORDER', metadata?: any): Promise<void> {
    try {
      const vendorRes = await query('SELECT user_id FROM vendors WHERE id = $1', [vendorId]);
      if (vendorRes.rows.length > 0 && vendorRes.rows[0].user_id) {
        await this.create({
          userId: vendorRes.rows[0].user_id,
          title,
          message,
          type,
          metadata,
        });
      }
    } catch (err: any) {
      console.error('[NotificationService] Failed to notify vendor:', err.message);
    }
  }

  /**
   * Notify customer by customer_profile ID
   */
  static async notifyCustomerProfile(customerProfileId: string, title: string, message: string, type: 'ORDER' | 'BOOKING' | 'DELIVERY' = 'ORDER', metadata?: any): Promise<void> {
    try {
      const profileRes = await query('SELECT user_id FROM customer_profiles WHERE id = $1', [customerProfileId]);
      if (profileRes.rows.length > 0 && profileRes.rows[0].user_id) {
        await this.create({
          userId: profileRes.rows[0].user_id,
          title,
          message,
          type,
          metadata,
        });
      }
    } catch (err: any) {
      console.error('[NotificationService] Failed to notify customer profile:', err.message);
    }
  }

  /**
   * Notify all active system administrators
   */
  static async notifyAdmins(title: string, message: string, type: 'MODERATION' | 'SYSTEM' = 'MODERATION', metadata?: any): Promise<void> {
    try {
      const adminUsers = await query(
        `SELECT u.id 
         FROM users u
         INNER JOIN user_roles ur ON ur.user_id = u.id
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE r.code = 'ADMIN' AND u.status = 'ACTIVE'`
      );

      for (const row of adminUsers.rows) {
        await this.create({
          userId: row.id,
          title,
          message,
          type,
          metadata,
        });
      }
    } catch (err: any) {
      console.error('[NotificationService] Failed to notify admins:', err.message);
    }
  }
}
