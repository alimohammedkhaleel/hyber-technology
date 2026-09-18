import { query } from '../config/database';
import { auditService } from './audit.service';

export interface CarouselSlideEntity {
  id: string;
  title_ar: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  image_url: string;
  button_text_ar?: string;
  link_url?: string;
  product_id?: string;
  product_name_ar?: string;
  category_id?: string;
  category_name_ar?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class CarouselService {
  async getActiveSlides(): Promise<CarouselSlideEntity[]> {
    const res = await query<CarouselSlideEntity>(
      `SELECT 
        s.*,
        p.name_ar AS product_name_ar,
        c.name_ar AS category_name_ar
      FROM carousel_slides s
      LEFT JOIN products_new p ON p.id = s.product_id
      LEFT JOIN categories_new c ON c.id = s.category_id
      WHERE s.is_active = TRUE
      ORDER BY s.sort_order ASC, s.created_at DESC`
    );
    return res.rows;
  }

  async getAllSlides(): Promise<CarouselSlideEntity[]> {
    const res = await query<CarouselSlideEntity>(
      `SELECT 
        s.*,
        p.name_ar AS product_name_ar,
        c.name_ar AS category_name_ar
      FROM carousel_slides s
      LEFT JOIN products_new p ON p.id = s.product_id
      LEFT JOIN categories_new c ON c.id = s.category_id
      ORDER BY s.sort_order ASC, s.created_at DESC`
    );
    return res.rows;
  }

  async createSlide(data: Partial<CarouselSlideEntity>, adminUserId?: string): Promise<CarouselSlideEntity> {
    const res = await query<CarouselSlideEntity>(
      `INSERT INTO carousel_slides (
        title_ar, title_en, subtitle_ar, subtitle_en, image_url, button_text_ar, link_url, product_id, category_id, sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.title_ar,
        data.title_en || null,
        data.subtitle_ar || null,
        data.subtitle_en || null,
        data.image_url,
        data.button_text_ar || 'تصفح الآن',
        data.link_url || null,
        data.product_id || null,
        data.category_id || null,
        data.sort_order || 0,
        data.is_active ?? true,
      ]
    );

    const slide = res.rows[0];

    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'CAROUSEL_SLIDE_CREATED',
        entityType: 'CAROUSEL_SLIDE',
        entityId: slide.id,
        metadata: { title_ar: slide.title_ar },
      });
    }

    return slide;
  }

  async updateSlide(id: string, data: Partial<CarouselSlideEntity>, adminUserId?: string): Promise<CarouselSlideEntity> {
    const res = await query<CarouselSlideEntity>(
      `UPDATE carousel_slides SET
        title_ar = COALESCE($1, title_ar),
        title_en = COALESCE($2, title_en),
        subtitle_ar = COALESCE($3, subtitle_ar),
        subtitle_en = COALESCE($4, subtitle_en),
        image_url = COALESCE($5, image_url),
        button_text_ar = COALESCE($6, button_text_ar),
        link_url = COALESCE($7, link_url),
        product_id = $8,
        category_id = $9,
        sort_order = COALESCE($10, sort_order),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        data.title_ar,
        data.title_en,
        data.subtitle_ar,
        data.subtitle_en,
        data.image_url,
        data.button_text_ar,
        data.link_url,
        data.product_id,
        data.category_id,
        data.sort_order,
        data.is_active,
        id,
      ]
    );

    const slide = res.rows[0];

    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'CAROUSEL_SLIDE_UPDATED',
        entityType: 'CAROUSEL_SLIDE',
        entityId: id,
        metadata: { title_ar: slide.title_ar },
      });
    }

    return slide;
  }

  async deleteSlide(id: string, adminUserId?: string): Promise<void> {
    await query('DELETE FROM carousel_slides WHERE id = $1', [id]);
    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'CAROUSEL_SLIDE_DELETED',
        entityType: 'CAROUSEL_SLIDE',
        entityId: id,
      });
    }
  }
}

export const carouselService = new CarouselService();
