import { AuditRepository, AuditLogEntry } from '../repositories/audit.repository';

export class AuditService {
  private auditRepo: AuditRepository;

  constructor() {
    this.auditRepo = new AuditRepository();
  }

  async log(entry: AuditLogEntry): Promise<void> {
    await this.auditRepo.log(entry);
  }

  async record(entry: AuditLogEntry): Promise<void> {
    await this.auditRepo.log(entry);
  }

  async getLogs(params: { action?: string; limit?: number }): Promise<AuditLogEntry[]> {
    return this.auditRepo.getRecentLogs(params.limit || 50);
  }

  async getRecentLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    return this.auditRepo.getRecentLogs(limit);
  }

  async deleteLog(id: number | string): Promise<boolean> {
    return this.auditRepo.deleteLog(id);
  }

  async deleteAllLogs(): Promise<number> {
    return this.auditRepo.deleteAllLogs();
  }
}

export const auditService = new AuditService();
