import { Router, Request, Response } from 'express';
import { PaymentController } from '../../../controllers/payment.controller';

const router = Router();
const paymentController = new PaymentController();

// Check Paymob abstraction readiness and configuration status
router.get('/status', (req: Request, res: Response) => paymentController.getGatewayStatus(req, res));

export default router;
