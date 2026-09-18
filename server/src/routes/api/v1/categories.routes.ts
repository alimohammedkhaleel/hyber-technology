import { Router, Request, Response, NextFunction } from 'express';
import { productService } from '../../../services/product.service';
import { sendSuccess } from '../../../utils/response.util';

const router = Router();

// Public: List all active categories
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await productService.getCategories(true);
    return sendSuccess(res, { categories });
  } catch (err) {
    next(err);
  }
});

export default router;
