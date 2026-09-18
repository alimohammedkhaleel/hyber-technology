import { Router, Request, Response, NextFunction } from 'express';
import { exchangeRateService } from '../../../services/exchangeRate.service';
import { authenticate } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/rbac.middleware';
import { UserRole } from '../../../types/roles';
import { sendSuccess, sendError } from '../../../utils/response.util';

const router = Router();

// Public: Get current USD/EGP rate
router.get('/current', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await exchangeRateService.getCurrentRate();
    const latestRecord = await exchangeRateService.getLatestRateRecord();
    return sendSuccess(res, {
      rate,
      from: 'USD',
      to: 'EGP',
      metadata: latestRecord,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Get rate history
router.get('/history', authenticate, requireRoles(UserRole.ADMIN, UserRole.STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const history = await exchangeRateService.getRateHistory(limit);
    return sendSuccess(res, { history });
  } catch (err) {
    next(err);
  }
});

// Admin: Set manual rate override
router.post('/override', authenticate, requireRoles(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rate, notes } = req.body;
    if (!rate || isNaN(Number(rate))) {
      return sendError(res, 'يرجى إدخال قيمة سعر صرف صحيحة.', 400, 'INVALID_RATE');
    }

    const updated = await exchangeRateService.setManualRate(Number(rate), req.user!.id, notes);
    return sendSuccess(res, {
      message: 'تم تعديل سعر الصرف يدوياً بنجاح وتحديث أسعار المنتجات المرتبطة بالدولار.',
      record: updated,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Trigger automated sync
router.post('/sync', authenticate, requireRoles(UserRole.ADMIN), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await exchangeRateService.syncDailyRate();
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
