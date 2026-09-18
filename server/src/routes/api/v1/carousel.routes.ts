import { Router, Request, Response, NextFunction } from 'express';
import { carouselService } from '../../../services/carousel.service';
import { sendSuccess } from '../../../utils/response.util';

const router = Router();

// Public: Get active hero slides
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const slides = await carouselService.getActiveSlides();
    return sendSuccess(res, { slides });
  } catch (err) {
    next(err);
  }
});

export default router;
