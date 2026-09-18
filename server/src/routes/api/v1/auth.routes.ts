import { Router, Request, Response } from 'express';
import { AuthController } from '../../../controllers/auth.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';
import { rateLimiter } from '../../../middleware/rateLimiter.middleware';

const router = Router();
const authController = new AuthController();

// Rate limit authentication attempts: max 15 requests per 5 minutes per IP
const authLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة بعد قليل.',
});

router.post('/register', authLimiter, (req: Request, res: Response) => authController.register(req, res));
router.post('/login', authLimiter, (req: Request, res: Response) => authController.login(req, res));
router.get('/me', authenticateToken, (req: Request, res: Response) => authController.me(req, res));

export default router;
