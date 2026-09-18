import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../../utils/response.util';
import { query } from '../../../config/database';

const router = Router();

// 1. Get user notifications with unread count
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const listRes = await query(
      `SELECT id, title, message, type, metadata, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user!.id]
    );

    const unreadRes = await query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );

    return sendSuccess(res, {
      notifications: listRes.rows,
      unread_count: unreadRes.rows[0]?.unread_count || 0
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return sendError(res, 'فشل في جلب الإشعارات', 500);
  }
});

// 2. Mark single notification as read
router.put('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, req.user!.id]
    );
    return sendSuccess(res, { id, is_read: true }, 'تم تحديث حالة الإشعار');
  } catch (err: any) {
    console.error('Error marking notification read:', err);
    return sendError(res, 'فشل في تحديث الإشعار', 500);
  }
});

// 3. Mark all notifications as read
router.put('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user!.id]
    );
    return sendSuccess(res, { success: true }, 'تم تعيين جميع الإشعارات كمقروءة');
  } catch (err: any) {
    console.error('Error marking all read:', err);
    return sendError(res, 'فشل في تحديث الإشعارات', 500);
  }
});

export default router;
