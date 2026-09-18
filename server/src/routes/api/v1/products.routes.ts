import { Router, Request, Response, NextFunction } from 'express';
import { productService } from '../../../services/product.service';
import { query } from '../../../config/database';
import { sendSuccess, sendError } from '../../../utils/response.util';

const router = Router();

// Public: Browse products with filters, search, pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, categorySlug, brandId, search, featured, limit, offset } = req.query;

    const result = await productService.getProducts({
      categoryId: categoryId as string,
      categorySlug: categorySlug as string,
      brandId: brandId as string,
      search: search as string,
      featuredOnly: featured === 'true',
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// Public: Get all brands with product counts
router.get('/brands', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const res2 = await query<{ id: string; name: string; logo_url: string | null; product_count: number }>(
      `SELECT b.id, b.name, b.logo_url, COUNT(p.id)::int AS product_count
       FROM brands b
       LEFT JOIN products_new p ON p.brand_id = b.id AND p.is_active = TRUE AND p.is_available = TRUE
       GROUP BY b.id
       ORDER BY b.name ASC`
    );
    return sendSuccess(res, { brands: res2.rows });
  } catch (err) {
    next(err);
  }
});

// Public: Get single product by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return sendError(res, 'المنتج المطلوب غير موجود أو تم إيقافه.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
});

export default router;
