import { query, getClient } from '../config/database';
import { exchangeRateService } from './exchangeRate.service';
import { pricingService } from './pricing.service';
import { auditService } from './audit.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../types/status';
import { logger } from '../utils/logger.util';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  payerPhone?: string;
  paymentProofUrl?: string;
  items: CreateOrderItemInput[];
}

export interface OrderDetail {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  payer_phone?: string;
  payment_proof_url?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  payment_verification_notes?: string;
  order_status: OrderStatus;
  exchange_rate_used?: number;
  internal_admin_notes?: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  status_history: Array<{
    id: number;
    previous_status?: string;
    new_status: string;
    changed_by_name?: string;
    notes?: string;
    created_at: string;
  }>;
}

export class OrderService {
  /**
   * Authoritative order creation with database transaction, row-locking, and stock check.
   */
  async createOrder(input: CreateOrderInput): Promise<OrderDetail> {
    if (!input.items || input.items.length === 0) {
      throw new Error('لا يمكن إنشاء طلب بدون منتجات في السلة.');
    }

    if (!input.customerName || !input.customerPhone || !input.deliveryAddress) {
      throw new Error('يرجى استكمال جميع بيانات التوصيل (الاسم، رقم الهاتف، العنوان بالتفصيل).');
    }

    const client = await getClient();
    const currentRate = await exchangeRateService.getCurrentRate();

    try {
      await client.query('BEGIN');

      let subtotal = 0;
      const orderItemsToInsert: Array<{
        productId: string;
        productName: string;
        sku: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        pricingMode: string;
        baseCurrency: string;
      }> = [];

      // Lock each product row to prevent race-condition overselling
      for (const item of input.items) {
        if (item.quantity <= 0) {
          throw new Error('كمية المنتج غير صالحة.');
        }

        const prodRes = await client.query(
          `SELECT * FROM products_new WHERE id = $1 FOR UPDATE`,
          [item.productId]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`المنتج المطلوب غير متوفر حالياً.`);
        }

        const product = prodRes.rows[0];

        if (!product.is_available || !product.is_active) {
          throw new Error(`المنتج "${product.name_ar}" غير متاح للشراء حالياً.`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(
            `الكمية المطلوبة من "${product.name_ar}" (${item.quantity}) غير متوفرة. المتاح حالياً في المخزن: ${product.stock_quantity}`
          );
        }

        // Authoritatively calculate EGP unit price
        const calc = pricingService.calculatePrice(product, currentRate);
        const unitPrice = calc.sellingPriceEgp;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        // Decrement stock atomically
        await client.query(
          `UPDATE products_new 
           SET stock_quantity = stock_quantity - $1,
               is_available = CASE WHEN (stock_quantity - $1) > 0 THEN TRUE ELSE FALSE END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, product.id]
        );

        orderItemsToInsert.push({
          productId: product.id,
          productName: product.name_ar,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
          pricingMode: product.pricing_mode,
          baseCurrency: product.base_currency,
        });
      }

      const deliveryFee = 0; // Local delivery or free
      const discount = 0;
      const finalTotal = subtotal + deliveryFee - discount;

      // Determine initial order and payment status
      let initialOrderStatus = OrderStatus.PENDING;
      let initialPaymentStatus = PaymentStatus.PENDING;

      if (input.paymentMethod === PaymentMethod.INSTAPAY || input.paymentMethod === PaymentMethod.VODAFONE_CASH) {
        initialPaymentStatus = input.paymentReference ? PaymentStatus.PAYMENT_VERIFICATION : PaymentStatus.PAYMENT_PENDING;
        initialOrderStatus = OrderStatus.PAYMENT_VERIFICATION;
      }

      // Generate unique human-readable order number: HTS-YYYY-XXXX
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `HTS-${year}-${randomSuffix}`;

      // Insert Order
      const orderInsertRes = await client.query(
        `INSERT INTO store_orders (
          order_number, customer_id, customer_name, customer_phone, delivery_address, notes,
          subtotal, delivery_fee, discount, total, payment_method, payment_status,
          payment_reference, payer_phone, payment_proof_url, order_status, exchange_rate_used
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17
        ) RETURNING *`,
        [
          orderNumber,
          input.customerId,
          input.customerName,
          input.customerPhone,
          input.deliveryAddress,
          input.notes || null,
          subtotal,
          deliveryFee,
          discount,
          finalTotal,
          input.paymentMethod,
          initialPaymentStatus,
          input.paymentReference || null,
          input.payerPhone || null,
          input.paymentProofUrl || null,
          initialOrderStatus,
          currentRate,
        ]
      );

      const order = orderInsertRes.rows[0];

      // Insert Order Items
      for (const oi of orderItemsToInsert) {
        await client.query(
          `INSERT INTO store_order_items (
            order_id, product_id, product_name, product_sku, quantity, unit_price, total_price,
            pricing_mode_snapshot, base_currency_snapshot
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            order.id,
            oi.productId,
            oi.productName,
            oi.sku,
            oi.quantity,
            oi.unitPrice,
            oi.totalPrice,
            oi.pricingMode,
            oi.baseCurrency,
          ]
        );
      }

      // Insert Initial Status History
      await client.query(
        `INSERT INTO store_order_status_history (
          order_id, previous_status, new_status, notes
        ) VALUES ($1, NULL, $2, $3)`,
        [order.id, initialOrderStatus, 'تم إنشاء الطلب بنجاح']
      );

      await client.query('COMMIT');

      logger.info(`New store order created: ${orderNumber} (Total: ${finalTotal} EGP)`);

      return this.getOrderById(order.id);
    } catch (err: any) {
      await client.query('ROLLBACK');
      logger.error('Order creation failed and transaction rolled back', { error: err.message });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves single order by ID with items and status timeline (Customer & Admin safe).
   */
  async getOrderById(orderId: string, customerId?: string): Promise<OrderDetail> {
    const conditions = ['o.id = $1'];
    const values: any[] = [orderId];

    if (customerId) {
      conditions.push('o.customer_id = $2');
      values.push(customerId);
    }

    const orderRes = await query(
      `SELECT o.* FROM store_orders o WHERE ${conditions.join(' AND ')}`,
      values
    );

    if (orderRes.rows.length === 0) {
      throw new Error('الطلب المطلوب غير موجود أو ليس لديك إذن للوصول إليه.');
    }

    const order = orderRes.rows[0];

    // Fetch items
    const itemsRes = await query(
      `SELECT * FROM store_order_items WHERE order_id = $1 ORDER BY id ASC`,
      [orderId]
    );

    // Fetch history
    const historyRes = await query(
      `SELECT h.*, u.phone AS changed_by_name
       FROM store_order_status_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.order_id = $1
       ORDER BY h.created_at ASC`,
      [orderId]
    );

    return {
      ...order,
      subtotal: Number(order.subtotal),
      delivery_fee: Number(order.delivery_fee),
      discount: Number(order.discount),
      total: Number(order.total),
      exchange_rate_used: order.exchange_rate_used ? Number(order.exchange_rate_used) : undefined,
      items: itemsRes.rows.map((r: any) => ({
        ...r,
        unit_price: Number(r.unit_price),
        total_price: Number(r.total_price),
      })),
      status_history: historyRes.rows as any,
    } as OrderDetail;
  }

  /**
   * Customer: submit payment reference (InstaPay or Vodafone Cash) for a pending order.
   */
  async submitPaymentProof(params: {
    orderId: string;
    customerId: string;
    paymentReference: string;
    payerPhone?: string;
    paymentProofUrl?: string;
  }): Promise<OrderDetail> {
    const order = await this.getOrderById(params.orderId, params.customerId);

    await query(
      `UPDATE store_orders SET
        payment_reference = $1,
        payer_phone = COALESCE($2, payer_phone),
        payment_proof_url = COALESCE($3, payment_proof_url),
        payment_status = 'PAYMENT_VERIFICATION',
        order_status = 'PAYMENT_VERIFICATION',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND customer_id = $5`,
      [
        params.paymentReference,
        params.payerPhone || null,
        params.paymentProofUrl || null,
        params.orderId,
        params.customerId,
      ]
    );

    await query(
      `INSERT INTO store_order_status_history (order_id, previous_status, new_status, notes)
       VALUES ($1, $2, 'PAYMENT_VERIFICATION', 'قام العميل بتسجيل الرقم المرجعي للدفع للمراجعة')`,
      [params.orderId, order.order_status]
    );

    return this.getOrderById(params.orderId);
  }

  /**
   * Admin: List all orders with filters (status, payment_status, search).
   */
  async getAdminOrders(filters: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderDetail[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters.status && filters.status !== 'ALL') {
      conditions.push(`o.order_status = $${idx++}`);
      values.push(filters.status);
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
      conditions.push(`o.payment_status = $${idx++}`);
      values.push(filters.paymentStatus);
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(`(
        o.order_number ILIKE $${idx} OR
        o.customer_name ILIKE $${idx} OR
        o.customer_phone ILIKE $${idx} OR
        o.payment_reference ILIKE $${idx}
      )`);
      values.push(term);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM store_orders o ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    values.push(limit, offset);
    const dataRes = await query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM store_order_items oi WHERE oi.order_id = o.id)::int AS items_count
       FROM store_orders o
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return {
      orders: dataRes.rows.map((r: any) => ({
        ...r,
        subtotal: Number(r.subtotal),
        delivery_fee: Number(r.delivery_fee),
        discount: Number(r.discount),
        total: Number(r.total),
        items: [],
        status_history: [],
      })),
      total,
    };
  }

  /**
   * Admin: Update order status with audit and history.
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, adminUserId: string, notes?: string): Promise<OrderDetail> {
    const order = await this.getOrderById(orderId);

    await query(
      `UPDATE store_orders SET
        order_status = $1,
        internal_admin_notes = COALESCE($2, internal_admin_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [newStatus, notes || null, orderId]
    );

    await query(
      `INSERT INTO store_order_status_history (order_id, previous_status, new_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, order.order_status, newStatus, adminUserId, notes || 'تحديث من قبل الإدارة']
    );

    await auditService.log({
      actorId: adminUserId,
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'ORDER',
      entityId: orderId,
      metadata: {
        order_number: order.order_number,
        previous_status: order.order_status,
        new_status: newStatus,
        notes,
      },
    });

    return this.getOrderById(orderId);
  }

  /**
   * Admin: Manual Payment Verification action (Confirm / Reject / Request Correction).
   */
  async verifyPayment(params: {
    orderId: string;
    action: 'CONFIRM' | 'REJECT' | 'REQUEST_CORRECTION';
    adminUserId: string;
    notes?: string;
  }): Promise<OrderDetail> {
    const order = await this.getOrderById(params.orderId);

    let nextPaymentStatus = PaymentStatus.PAYMENT_VERIFICATION;
    let nextOrderStatus = order.order_status;
    let actionDesc = '';

    if (params.action === 'CONFIRM') {
      nextPaymentStatus = PaymentStatus.PAID;
      nextOrderStatus = OrderStatus.CONFIRMED;
      actionDesc = 'تم اعتماد التحويل وتأكيد استلام الدفعة بنجاح';
    } else if (params.action === 'REJECT') {
      nextPaymentStatus = PaymentStatus.REJECTED;
      nextOrderStatus = OrderStatus.REJECTED;
      actionDesc = 'تم رفض إثبات الدفع لعدم تطابق التحويل';
    } else {
      nextPaymentStatus = PaymentStatus.PAYMENT_PENDING;
      actionDesc = 'مطلوب مراجعة وتصحيح الرقم المرجعي للتحويل';
    }

    await query(
      `UPDATE store_orders SET
        payment_status = $1,
        order_status = $2,
        payment_verified_at = CURRENT_TIMESTAMP,
        payment_verified_by = $3,
        payment_verification_notes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5`,
      [
        nextPaymentStatus,
        nextOrderStatus,
        params.adminUserId,
        params.notes || actionDesc,
        params.orderId,
      ]
    );

    await query(
      `INSERT INTO store_order_status_history (order_id, previous_status, new_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.orderId, order.order_status, nextOrderStatus, params.adminUserId, `${actionDesc}: ${params.notes || ''}`]
    );

    await auditService.log({
      actorId: params.adminUserId,
      action: `PAYMENT_VERIFIED_${params.action}`,
      entityType: 'ORDER_PAYMENT',
      entityId: params.orderId,
      metadata: {
        order_number: order.order_number,
        action: params.action,
        payment_reference: order.payment_reference,
        notes: params.notes,
      },
    });

    return this.getOrderById(params.orderId);
  }

  /**
   * Customer: Get order history.
   */
  async getCustomerOrders(customerId: string): Promise<OrderDetail[]> {
    const res = await query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM store_order_items oi WHERE oi.order_id = o.id)::int AS items_count
       FROM store_orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [customerId]
    );

    return res.rows.map((r: any) => ({
      ...r,
      subtotal: Number(r.subtotal),
      delivery_fee: Number(r.delivery_fee),
      discount: Number(r.discount),
      total: Number(r.total),
      items: [],
      status_history: [],
    }));
  }
}

export const orderService = new OrderService();
