import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/rbac.middleware';
import { UserRole } from '../../../types/roles';
import { sendSuccess, sendError } from '../../../utils/response.util';

const router = Router();

// Helper to get safe upload directory (uses /tmp on serverless environments like Vercel)
const getUploadsDir = (): string => {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dir = isServerless ? '/tmp/uploads' : path.resolve(__dirname, '../../../../uploads');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Ignore filesystem creation errors on read-only environments
  }
  return dir;
};

/**
 * Admin: Upload image via Base64 payload
 */
router.post(
  '/image',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, filename, folder = 'products' } = req.body;

      if (!data || typeof data !== 'string') {
        return sendError(res, 'بيانات الصورة غير صالحة.', 400, 'INVALID_IMAGE_DATA');
      }

      // Match base64 data URI format: data:image/png;base64,...
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(mimeType)) {
          return sendError(res, 'نوع الصورة غير مدعوم. الصيغ المدعومة: JPG, PNG, WebP, SVG.', 400, 'UNSUPPORTED_TYPE');
        }
        ext = mimeType.split('/')[1].replace('+xml', '');
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        // Assume raw base64 string
        buffer = Buffer.from(data, 'base64');
      }

      // Max size: 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return sendError(res, 'حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.', 400, 'FILE_TOO_LARGE');
      }

      const uploadsBase = getUploadsDir();
      const targetDir = path.join(uploadsBase, folder);
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      } catch (e) {
        // Safe directory creation
      }

      const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(targetDir, safeFilename);

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${folder}/${safeFilename}`;

      return sendSuccess(res, {
        message: 'تم رفع الصورة بنجاح.',
        url: fileUrl,
        filename: safeFilename,
        size: buffer.length,
      }, undefined, 201);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
