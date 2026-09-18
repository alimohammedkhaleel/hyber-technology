import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/response.util';

const auditService = new AuditService();

export class AuditController {
  async getRecentLogs(req: Request, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const logs = await auditService.getRecentLogs(limit);
      return sendSuccess(res, logs);
    } catch (err: any) {
      return sendError(res, err.message, 500, 'AUDIT_FETCH_FAILED');
    }
  }
}
