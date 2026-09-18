import { query } from '../config/database';

export interface AuditLogEntry {
  id?: number;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt?: Date;
}

export class AuditRepository {
  /**
   * Insert a secure audit trail record into audit_logs.
   * Passwords and payment credentials must never be included in metadata.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.actorId || null,
          entry.action,
          entry.entityType,
          entry.entityId || null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ipAddress || null,
        ]
      );
    } catch (err: any) {
      // Audit log failures should not crash the core user flow, but should be logged to console
      console.error('[AUDIT LOG INSERTION FAILED]:', err.message);
    }
  }

  /**
   * Retrieve recent audit logs for administrators
   */
  async getRecentLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    const res = await query<AuditLogEntry>(
      `SELECT id, actor_id AS "actorId", action, entity_type AS "entityType", 
              entity_id AS "entityId", metadata, ip_address AS "ipAddress", created_at AS "createdAt"
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  /**
   * Delete a single audit log by ID
   */
  async deleteLog(id: number | string): Promise<boolean> {
    const res = await query('DELETE FROM audit_logs WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Delete all audit logs to clear storage space
   */
  async deleteAllLogs(): Promise<number> {
    const res = await query('DELETE FROM audit_logs');
    return res.rowCount ?? 0;
  }
}
