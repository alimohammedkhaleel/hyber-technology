import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../../config/database';
import { authenticate } from '../../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../../utils/response.util';
import { exchangeRateService } from '../../../services/exchangeRate.service';
import { pricingService } from '../../../services/pricing.service';

const router = Router();

// Get customer cart
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const currentRate = await exchangeRateService.getCurrentRate();

    // Ensure cart exists
    let cartRes = await query<{ id: string }>('SELECT id FROM carts_store WHERE customer_id = $1', [customerId]);
    if (cartRes.rows.length === 0) {
      cartRes = await query<{ id: string }>('INSERT INTO carts_store (customer_id) VALUES ($1) RETURNING id', [customerId]);
    }
    const cartId = cartRes.rows[0].id;

    // Fetch items with products
    const itemsRes = await query(
      `SELECT 
        ci.id AS item_id,
        ci.quantity,
        p.*,
        c.name_ar AS category_name_ar
      FROM cart_items_store ci
      JOIN products_new p ON p.id = ci.product_id
      LEFT JOIN categories_new c ON c.id = p.category_id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC`,
      [cartId]
    );

    let subtotal = 0;
    const items = itemsRes.rows.map((row: any) => {
      const pricing = pricingService.calculatePrice(row, currentRate);
      const itemTotal = pricing.sellingPriceEgp * row.quantity;
      subtotal += itemTotal;
      return {
        id: row.item_id,
        productId: row.id,
        nameAr: row.name_ar,
        nameEn: row.name_en,
        sku: row.sku,
        imageUrl: row.image_url,
        stockQuantity: row.stock_quantity,
        isAvailable: row.is_available && row.stock_quantity > 0,
        quantity: row.quantity,
        unitPrice: pricing.sellingPriceEgp,
        totalPrice: itemTotal,
        pricing,
      };
    });

    return sendSuccess(res, {
      cart: {
        id: cartId,
        items,
        subtotal,
        total: subtotal,
        itemCount: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Add item to cart
router.post('/items', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return sendError(res, 'يجب تحديد المنتج المطلوب إضافته.', 400, 'MISSING_PRODUCT');
    }

    const prodRes = await query('SELECT * FROM products_new WHERE id = $1 AND is_active = TRUE', [productId]);
    if (prodRes.rows.length === 0) {
      return sendError(res, 'المنتج المطلوب غير متاح.', 404, 'PRODUCT_NOT_FOUND');
    }

    // Ensure cart exists
    let cartRes = await query<{ id: string }>('SELECT id FROM carts_store WHERE customer_id = $1', [customerId]);
    if (cartRes.rows.length === 0) {
      cartRes = await query<{ id: string }>('INSERT INTO carts_store (customer_id) VALUES ($1) RETURNING id', [customerId]);
    }
    const cartId = cartRes.rows[0].id;

    // Upsert cart item
    await query(
      `INSERT INTO cart_items_store (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items_store.quantity + EXCLUDED.quantity`,
      [cartId, productId, parseInt(quantity, 10) || 1]
    );

    return sendSuccess(res, { message: 'تمت إضافة المنتج إلى سلة المشتريات بنجاح.' });
  } catch (err) {
    next(err);
  }
});

// Update item quantity
router.patch('/items/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      await query('DELETE FROM cart_items_store WHERE id = $1', [req.params.id]);
      return sendSuccess(res, { message: 'تم حذف المنتج من السلة.' });
    }

    await query('UPDATE cart_items_store SET quantity = $1 WHERE id = $2', [qty, req.params.id]);
    return sendSuccess(res, { message: 'تم تعديل الكمية بنجاح.' });
  } catch (err) {
    next(err);
  }
});

// Remove item from cart
router.delete('/items/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM cart_items_store WHERE id = $1', [req.params.id]);
    return sendSuccess(res, { message: 'تم إزالة المنتج من السلة.' });
  } catch (err) {
    next(err);
  }
});

// Clear cart
router.delete('/clear', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const cartRes = await query<{ id: string }>('SELECT id FROM carts_store WHERE customer_id = $1', [customerId]);
    if (cartRes.rows.length > 0) {
      await query('DELETE FROM cart_items_store WHERE cart_id = $1', [cartRes.rows[0].id]);
    }
    return sendSuccess(res, { message: 'تم تفريغ سلة المشتريات.' });
  } catch (err) {
    next(err);
  }
});

export default router;
