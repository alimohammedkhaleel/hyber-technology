import { Router, Request, Response, NextFunction } from 'express';
import { settingsService } from '../../../services/settings.service';
import { sendSuccess } from '../../../utils/response.util';

const router = Router();

// Public: Get store settings and payment instructions
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getSettings();
    return sendSuccess(res, { settings });
  } catch (err) {
    next(err);
  }
});

export default router;
