import { Request, Response } from 'express';
import { PaymentService } from '../services/payments/payment.service';
import { sendSuccess } from '../utils/response.util';

const paymentService = new PaymentService();

export class PaymentController {
  /**
   * Returns gateway configuration status and Paymob preparation details
   */
  getGatewayStatus(_req: Request, res: Response) {
    const status = paymentService.getGatewayStatus();
    return sendSuccess(res, status, 'Payment gateway status retrieved');
  }
}
