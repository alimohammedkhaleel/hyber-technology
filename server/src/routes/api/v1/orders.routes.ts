import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../../../services/order.service';
import { authenticate } from '../../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../../utils/response.util';
import { PaymentMethod } from '../../../types/status';

const router = Router();

// Customer: Place a new order
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      notes,
      paymentMethod,
      paymentReference,
      payerPhone,
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'يجب تحديد منتج واحد على الأقل لإتمام الطلب.', 400, 'INVALID_ITEMS');
    }

    if (!customerName || !customerPhone || !deliveryAddress) {
      return sendError(res, 'يرجى إدخال اسم العميل ورقم الهاتف وعنوان التوصيل.', 400, 'MISSING_FIELDS');
    }

    const order = await orderService.createOrder({
      customerId: req.user!.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      notes: notes ? notes.trim() : undefined,
      paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.CASH_ON_DELIVERY,
      paymentReference: paymentReference ? paymentReference.trim() : undefined,
      payerPhone: payerPhone ? payerPhone.trim() : undefined,
      items: items.map((i: any) => ({
        productId: i.productId || i.product_id,
        quantity: parseInt(i.quantity, 10) || 1,
      })),
    });

    return sendSuccess(res, {
      message: 'تم تسجيل طلبك بنجاح وسنقوم بمراجعته وتجهيزه في أقرب وقت.',
      order,
    }, undefined, 201);
  } catch (err) {
    next(err);
  }
});

// Customer: Get my orders history
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getCustomerOrders(req.user!.id);
    return sendSuccess(res, { orders });
  } catch (err) {
    next(err);
  }
});

// Customer: Get specific order details & tracking
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user!.id);
    return sendSuccess(res, { order });
  } catch (err) {
    next(err);
  }
});

// Customer: Submit payment reference for InstaPay or Vodafone Cash
router.post('/:id/payment-proof', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentReference, payerPhone, paymentProofUrl } = req.body;

    if (!paymentReference || !paymentReference.trim()) {
      return sendError(res, 'يرجى إدخال الرقم المرجعي للتحويل.', 400, 'MISSING_REFERENCE');
    }

    const updatedOrder = await orderService.submitPaymentProof({
      orderId: req.params.id,
      customerId: req.user!.id,
      paymentReference: paymentReference.trim(),
      payerPhone: payerPhone ? payerPhone.trim() : undefined,
      paymentProofUrl: paymentProofUrl || undefined,
    });

    return sendSuccess(res, {
      message: 'تم حفظ الرقم المرجعي للدفع وسيتم التحقق منه من قبل فريق العمل.',
      order: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
