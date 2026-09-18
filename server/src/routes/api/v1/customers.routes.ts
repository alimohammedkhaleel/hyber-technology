import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../../config/database';
import { authenticate } from '../../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../../utils/response.util';

const router = Router();

// Customer: Get my profile
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resProfile = await query(
      `SELECT cp.*, u.phone AS auth_phone, u.email AS auth_email
       FROM customer_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.user_id = $1`,
      [req.user!.id]
    );

    if (resProfile.rows.length === 0) {
      return sendError(res, 'الملف الشخصي غير موجود.', 404, 'NOT_FOUND');
    }

    const addresses = await query(
      `SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [resProfile.rows[0].id]
    );

    return sendSuccess(res, {
      profile: resProfile.rows[0],
      addresses: addresses.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Customer: Update profile
router.put('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, phone, email } = req.body;
    const resProfile = await query(
      `UPDATE customer_profiles SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
      RETURNING *`,
      [fullName, phone, email, req.user!.id]
    );

    return sendSuccess(res, {
      message: 'تم تحديث البيانات بنجاح.',
      profile: resProfile.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Customer: Add address
router.post('/addresses', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label, address, area, city, deliveryNotes, isDefault } = req.body;
    const profileRes = await query('SELECT id FROM customer_profiles WHERE user_id = $1', [req.user!.id]);
    if (profileRes.rows.length === 0) {
      return sendError(res, 'حساب العميل غير موجود.', 404, 'NOT_FOUND');
    }
    const customerId = profileRes.rows[0].id;

    if (isDefault) {
      await query('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1', [customerId]);
    }

    const newAddr = await query(
      `INSERT INTO customer_addresses (
        customer_id, label, address, area, city, delivery_notes, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        customerId,
        label || 'العنوان الرئيسي',
        address,
        area || 'السويس',
        city || 'السويس',
        deliveryNotes || null,
        isDefault ?? true,
      ]
    );

    return sendSuccess(res, { address: newAddr.rows[0] }, undefined, 201);
  } catch (err) {
    next(err);
  }
});

// Customer: Delete address
router.delete('/addresses/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileRes = await query('SELECT id FROM customer_profiles WHERE user_id = $1', [req.user!.id]);
    if (profileRes.rows.length === 0) {
      return sendError(res, 'حساب العميل غير موجود.', 404, 'NOT_FOUND');
    }
    const customerId = profileRes.rows[0].id;

    await query('DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2', [
      req.params.id,
      customerId,
    ]);

    return sendSuccess(res, { message: 'تم حذف العنوان بنجاح.' });
  } catch (err) {
    next(err);
  }
});

export default router;
