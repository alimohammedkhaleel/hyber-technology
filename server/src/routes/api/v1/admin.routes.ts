import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/rbac.middleware';
import { UserRole } from '../../../types/roles';
import { query } from '../../../config/database';
import { productService } from '../../../services/product.service';
import { carouselService } from '../../../services/carousel.service';
import { settingsService } from '../../../services/settings.service';
import { exchangeRateService } from '../../../services/exchangeRate.service';
import { orderService } from '../../../services/order.service';
import { auditService } from '../../../services/audit.service';
import { OrderStatus } from '../../../types/status';
import { sendSuccess, sendError } from '../../../utils/response.util';

const router = Router();

// Protect ALL admin routes with authentication & Admin/Staff roles
router.use(authenticate, requireRoles(UserRole.ADMIN, UserRole.STAFF));

// -----------------------------------------------------------------------------
// 1. DASHBOARD OVERVIEW METRICS (Real Database Data)
// -----------------------------------------------------------------------------
router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [ordersCountRes, pendingPaymentsRes, lowStockRes, productsCountRes, customersCountRes, revenueRes] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM store_orders WHERE created_at >= CURRENT_DATE`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM store_orders WHERE payment_status = 'PAYMENT_VERIFICATION'`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM products_new WHERE stock_quantity <= low_stock_threshold AND is_active = TRUE`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM products_new WHERE is_active = TRUE`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM customer_profiles`),
      query<{ sum: string }>(`SELECT COALESCE(SUM(total), 0) AS sum FROM store_orders WHERE payment_status = 'PAID' OR order_status = 'DELIVERED'`),
    ]);

    const latestExchangeRate = await exchangeRateService.getCurrentRate();
    const rateRecord = await exchangeRateService.getLatestRateRecord();

    return sendSuccess(res, {
      metrics: {
        todayOrders: parseInt(ordersCountRes.rows[0]?.count || '0', 10),
        pendingPaymentVerifications: parseInt(pendingPaymentsRes.rows[0]?.count || '0', 10),
        lowStockItems: parseInt(lowStockRes.rows[0]?.count || '0', 10),
        totalActiveProducts: parseInt(productsCountRes.rows[0]?.count || '0', 10),
        totalCustomers: parseInt(customersCountRes.rows[0]?.count || '0', 10),
        totalRevenueEgp: parseFloat(revenueRes.rows[0]?.sum || '0'),
        currentUsdRate: latestExchangeRate,
        rateLastUpdated: rateRecord?.effective_at || new Date().toISOString(),
        isManualOverride: rateRecord?.is_manual_override || false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 2. PRODUCTS MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, brandId, search, limit, offset } = req.query;
    const result = await productService.getProducts({
      categoryId: categoryId as string,
      brandId: brandId as string,
      search: search as string,
      availableOnly: false,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return sendError(res, 'المنتج المطلوب غير موجود.', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.createProduct(req.body, req.user!.id);
    return sendSuccess(res, { message: 'تمت إضافة المنتج بنجاح.', product }, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user!.id);
    return sendSuccess(res, { message: 'تم تحديث بيانات المنتج بنجاح.', product });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.deleteProduct(req.params.id, req.user!.id);
    return sendSuccess(res, { message: 'تم تعطيل المنتج بنجاح.' });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 3. CATEGORIES MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await productService.getCategories(false);
    return sendSuccess(res, { categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await productService.createCategory(req.body);
    return sendSuccess(res, { message: 'تم إنشاء القسم بنجاح.', category }, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await productService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, { message: 'تم تحديث بيانات القسم بنجاح.', category });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.deleteCategory(req.params.id);
    return sendSuccess(res, { message: 'تم تعطيل القسم بنجاح.' });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 4. CAROUSEL SLIDES MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/carousel', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const slides = await carouselService.getAllSlides();
    return sendSuccess(res, { slides });
  } catch (err) {
    next(err);
  }
});

router.post('/carousel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slide = await carouselService.createSlide(req.body, req.user!.id);
    return sendSuccess(res, { message: 'تمت إضافة شريحة العرض بنجاح.', slide }, undefined, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/carousel/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slide = await carouselService.updateSlide(req.params.id, req.body, req.user!.id);
    return sendSuccess(res, { message: 'تم تحديث شريحة العرض بنجاح.', slide });
  } catch (err) {
    next(err);
  }
});

router.delete('/carousel/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await carouselService.deleteSlide(req.params.id, req.user!.id);
    return sendSuccess(res, { message: 'تم حذف شريحة العرض.' });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 5. ORDERS & PAYMENT VERIFICATION MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, paymentStatus, search, limit, offset } = req.query;
    const result = await orderService.getAdminOrders({
      status: status as string,
      paymentStatus: paymentStatus as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return sendSuccess(res, { order });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return sendError(res, 'يجب تحديد حالة الطلب الجديدة.', 400, 'MISSING_STATUS');
    }

    const order = await orderService.updateOrderStatus(
      req.params.id,
      status as OrderStatus,
      req.user!.id,
      notes
    );

    return sendSuccess(res, { message: 'تم تحديث حالة الطلب بنجاح.', order });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/verify-payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, notes } = req.body;
    if (!action || !['CONFIRM', 'REJECT', 'REQUEST_CORRECTION'].includes(action)) {
      return sendError(res, 'إجراء التحقق من الدفع غير صالح.', 400, 'INVALID_ACTION');
    }

    const order = await orderService.verifyPayment({
      orderId: req.params.id,
      action: action as any,
      adminUserId: req.user!.id,
      notes,
    });

    return sendSuccess(res, { message: 'تم تحديث حالة الدفع للطلب بنجاح.', order });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 6. STORE & PAYMENT SETTINGS
// -----------------------------------------------------------------------------
router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getSettings();
    return sendSuccess(res, { settings });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.updateSettings(req.body, req.user!.id);
    return sendSuccess(res, { message: 'تم حفظ إعدادات المتجر والدفع بنجاح.', settings });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 7. CUSTOMERS MANAGEMENT (With Period Filters & Fixed Order/Spending Calculations)
// -----------------------------------------------------------------------------
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const period = (req.query.period as string) || 'all'; // 'all' | 'week' | 'month' | 'year'

    let dateCondition = '';
    if (period === 'week') {
      dateCondition = ` AND o.created_at >= NOW() - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateCondition = ` AND o.created_at >= NOW() - INTERVAL '30 days'`;
    } else if (period === 'year') {
      dateCondition = ` AND o.created_at >= NOW() - INTERVAL '1 year'`;
    }

    let querySql = `
      SELECT 
        cp.*,
        u.phone AS auth_phone,
        u.created_at AS registered_at,
        (
          SELECT COUNT(*) 
          FROM store_orders o 
          WHERE (o.customer_id = u.id OR o.customer_id = cp.id)
            AND o.order_status NOT IN ('CANCELLED', 'REJECTED')
            ${dateCondition}
        )::int AS orders_count,
        (
          SELECT COALESCE(SUM(o.total), 0) 
          FROM store_orders o 
          WHERE (o.customer_id = u.id OR o.customer_id = cp.id)
            AND (o.payment_status = 'PAID' OR o.order_status IN ('CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'))
            ${dateCondition}
        )::numeric AS total_spent
      FROM customer_profiles cp
      JOIN users u ON u.id = cp.user_id
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      querySql += ` WHERE cp.full_name ILIKE $1 OR cp.phone ILIKE $1 OR cp.email ILIKE $1 OR u.phone ILIKE $1`;
      params.push(`%${search.trim()}%`);
    }

    querySql += ` ORDER BY cp.created_at DESC LIMIT 100`;
    const result = await query(querySql, params);

    return sendSuccess(res, {
      customers: result.rows,
      period,
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 8. AUDIT LOGS (Human-Readable Activity Log for Non-Technical Users)
// -----------------------------------------------------------------------------
function formatAuditLogArabic(log: any) {
  let titleAr = 'نشاط عام بالنظام';
  let descAr = 'تم تنفيذ إجراء بالنظام.';
  let badgeColor = 'info';

  const action = log.action || '';
  const meta = log.metadata || {};

  if (action === 'USER_LOGIN') {
    titleAr = 'تسجيل دخول للنظام';
    descAr = 'قام المستخدم بتسجيل الدخول بنجاح إلى الحساب.';
    badgeColor = 'success';
  } else if (action === 'USER_REGISTERED') {
    titleAr = 'تسجيل عميل جديد';
    descAr = `تم تسجيل حساب عميل جديد بنجاح ${meta.phone ? `(هاتف: ${meta.phone})` : ''}`;
    badgeColor = 'success';
  } else if (action.startsWith('PAYMENT_VERIFIED')) {
    const act = meta.action || action.replace('PAYMENT_VERIFIED_', '');
    if (act === 'CONFIRM') {
      titleAr = 'تأكيد واستلام دفعة طلب';
      descAr = `تم اعتماد التحويل البنكي وتأكيد الطلب #${meta.order_number || ''}`;
      badgeColor = 'success';
    } else if (act === 'REJECT') {
      titleAr = 'رفض إثبات دفع';
      descAr = `تم رفض إثبات الدفع للطلب #${meta.order_number || ''}`;
      badgeColor = 'danger';
    } else {
      titleAr = 'طلب تصحيح إثبات دفع';
      descAr = `تم طلب مراجعة التحويل للطلب #${meta.order_number || ''}`;
      badgeColor = 'warning';
    }
  } else if (action === 'ORDER_STATUS_UPDATED') {
    titleAr = 'تحديث حالة طلب';
    descAr = `تم تعديل حالة الطلب #${meta.order_number || ''} إلى: ${meta.new_status || ''}`;
    badgeColor = 'info';
  } else if (action === 'USD_RATE_MANUAL_OVERRIDE') {
    titleAr = 'تعديل سعر صرف الدولار';
    descAr = `تم تحديث سعر صرف الدولار يدوياً إلى ${meta.rate || ''} ج.م`;
    badgeColor = 'warning';
  } else if (action === 'STORE_SETTINGS_UPDATED') {
    titleAr = 'تحديث إعدادات المتجر والشحن';
    descAr = 'تم حفظ التعديلات على إعدادات المتجر وطرق الدفع وأسعار الشحن للمحافظات.';
    badgeColor = 'primary';
  } else if (action === 'PRODUCT_CREATED') {
    titleAr = 'إضافة منتج جديد';
    descAr = 'تمت إضافة جهاز/منتج جديد بنجاح إلى الكتالوج.';
    badgeColor = 'info';
  } else if (action === 'PRODUCT_UPDATED') {
    titleAr = 'تعديل بيانات منتج';
    descAr = 'تم تعديل مواصفات أو سعر المنتج بنجاح.';
    badgeColor = 'info';
  } else if (action === 'PRODUCT_DELETED') {
    titleAr = 'تعطيل / حذف منتج';
    descAr = 'تم تعطيل أو إخفاء المنتج من المتجر.';
    badgeColor = 'danger';
  }

  return {
    ...log,
    title_ar: titleAr,
    desc_ar: descAr,
    badge_color: badgeColor,
  };
}

router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const action = req.query.action as string;

    const rawLogs = await auditService.getLogs({
      action: action || undefined,
      limit,
    });

    const logs = (rawLogs || []).map(formatAuditLogArabic);

    return sendSuccess(res, { logs });
  } catch (err) {
    next(err);
  }
});

router.delete('/audit-logs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await auditService.deleteLog(id);
    return sendSuccess(res, { message: 'تم حذف النشاط بنجاح.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/audit-logs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await auditService.deleteAllLogs();
    return sendSuccess(res, { message: 'تم تفريغ وحذف جميع سجلات النشاطات بنجاح.', deletedCount: count });
  } catch (err) {
    next(err);
  }
});

export default router;
