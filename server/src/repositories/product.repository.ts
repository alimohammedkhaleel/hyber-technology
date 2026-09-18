import { query, getClient } from '../config/database';
import { exchangeRateService } from '../services/exchangeRate.service';
import { pricingService, CalculatedProductPrice } from '../services/pricing.service';
import { auditService } from '../services/audit.service';
import { logger } from '../utils/logger.util';

export interface ProductEntity {
  id: string;
  category_id?: string;
  category_name_ar?: string;
  category_name_en?: string;
  category_slug?: string;
  brand_id?: string;
  brand_name?: string;
  name_ar: string;
  name_en: string;
  sku: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  images: string[];
  pricing_mode: 'FIXED_EGP' | 'USD_LINKED';
  base_cost: number;
  base_currency: 'EGP' | 'USD';
  profit_margin_percent: number;
  manual_egp_price: number;
  old_price?: number;
  discount_percent: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  is_active: boolean;
  specifications: Record<string, any>;
  warranty_info?: string;
  created_at: string;
  updated_at: string;
  // Calculated EGP pricing fields
  pricing?: CalculatedProductPrice;
}

export interface CategoryEntity {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url?: string;
  icon_name?: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export class ProductRepository {
  /**
   * Finds products matching query filters and calculates live authoritative EGP prices.
   */
  async findProducts(filters: {
    categoryId?: string;
    categorySlug?: string;
    brandId?: string;
    search?: string;
    featuredOnly?: boolean;
    availableOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: ProductEntity[]; total: number }> {
    const currentRate = await exchangeRateService.getCurrentRate();
    const conditions: string[] = ['p.is_active = TRUE'];
    const values: any[] = [];
    let idx = 1;

    if (filters.availableOnly !== false) {
      conditions.push('p.is_available = TRUE');
    }

    if (filters.featuredOnly) {
      conditions.push('p.is_featured = TRUE');
    }

    if (filters.categoryId) {
      conditions.push(`p.category_id = $${idx++}`);
      values.push(filters.categoryId);
    }

    if (filters.categorySlug) {
      conditions.push(`c.slug = $${idx++}`);
      values.push(filters.categorySlug);
    }

    if (filters.brandId) {
      conditions.push(`p.brand_id = $${idx++}`);
      values.push(filters.brandId);
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(`(
        p.name_ar ILIKE $${idx} OR
        p.name_en ILIKE $${idx} OR
        p.sku ILIKE $${idx} OR
        p.description_ar ILIKE $${idx} OR
        c.name_ar ILIKE $${idx} OR
        b.name ILIKE $${idx}
      )`);
      values.push(term);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Count total query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products_new p
      LEFT JOIN categories_new c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Data query
    const dataSql = `
      SELECT 
        p.*,
        c.name_ar AS category_name_ar,
        c.name_en AS category_name_en,
        c.slug AS category_slug,
        b.name AS brand_name
      FROM products_new p
      LEFT JOIN categories_new c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${whereClause}
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);

    const dataRes = await query<ProductEntity>(dataSql, values);
    const products = dataRes.rows.map((row) => ({
      ...row,
      pricing: pricingService.calculatePrice(row, currentRate),
    }));

    return { products, total };
  }

  /**
   * Find a single product by ID with full specifications and live EGP calculation.
   */
  async findById(id: string): Promise<ProductEntity | null> {
    const currentRate = await exchangeRateService.getCurrentRate();
    const res = await query<ProductEntity>(
      `SELECT 
        p.*,
        c.name_ar AS category_name_ar,
        c.name_en AS category_name_en,
        c.slug AS category_slug,
        b.name AS brand_name
      FROM products_new p
      LEFT JOIN categories_new c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.id = $1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      pricing: pricingService.calculatePrice(row, currentRate),
    };
  }

  /**
   * List all categories with product counts.
   */
  async getCategories(activeOnly: boolean = true): Promise<CategoryEntity[]> {
    const whereClause = activeOnly ? 'WHERE c.is_active = TRUE' : '';
    const res = await query<CategoryEntity>(
      `SELECT 
        c.*,
        COUNT(p.id)::int AS product_count
      FROM categories_new c
      LEFT JOIN products_new p ON p.category_id = c.id AND p.is_active = TRUE
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name_ar ASC`
    );
    return res.rows;
  }

  /**
   * Admin: Create a new product.
   */
  async createProduct(data: Partial<ProductEntity>, adminUserId?: string): Promise<ProductEntity> {
    const res = await query<ProductEntity>(
      `INSERT INTO products_new (
        category_id, brand_id, name_ar, name_en, sku, description_ar, description_en,
        image_url, images, pricing_mode, base_cost, base_currency, profit_margin_percent,
        manual_egp_price, old_price, discount_percent, stock_quantity, low_stock_threshold,
        is_available, is_featured, is_active, specifications, warranty_info
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        data.category_id || null,
        data.brand_id || null,
        data.name_ar,
        data.name_en || data.name_ar,
        data.sku,
        data.description_ar || null,
        data.description_en || null,
        data.image_url || null,
        JSON.stringify(data.images || []),
        data.pricing_mode || 'FIXED_EGP',
        data.base_cost || 0,
        data.base_currency || 'EGP',
        data.profit_margin_percent || 0,
        data.manual_egp_price || 0,
        data.old_price || null,
        data.discount_percent || 0,
        data.stock_quantity || 0,
        data.low_stock_threshold || 3,
        data.is_available ?? true,
        data.is_featured ?? false,
        data.is_active ?? true,
        JSON.stringify(data.specifications || {}),
        data.warranty_info || null,
      ]
    );

    const product = res.rows[0];

    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'PRODUCT_CREATED',
        entityType: 'PRODUCT',
        entityId: product.id,
        metadata: { name_ar: product.name_ar, sku: product.sku },
      });
    }

    return product;
  }

  /**
   * Admin: Update an existing product.
   */
  async updateProduct(id: string, data: Partial<ProductEntity>, adminUserId?: string): Promise<ProductEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('المنتج المطلوب غير موجود');
    }

    const res = await query<ProductEntity>(
      `UPDATE products_new SET
        category_id = COALESCE($1, category_id),
        brand_id = COALESCE($2, brand_id),
        name_ar = COALESCE($3, name_ar),
        name_en = COALESCE($4, name_en),
        sku = COALESCE($5, sku),
        description_ar = COALESCE($6, description_ar),
        description_en = COALESCE($7, description_en),
        image_url = COALESCE($8, image_url),
        images = CASE WHEN $9::jsonb IS NOT NULL THEN $9::jsonb ELSE images END,
        pricing_mode = COALESCE($10, pricing_mode),
        base_cost = COALESCE($11, base_cost),
        base_currency = COALESCE($12, base_currency),
        profit_margin_percent = COALESCE($13, profit_margin_percent),
        manual_egp_price = COALESCE($14, manual_egp_price),
        old_price = $15,
        discount_percent = COALESCE($16, discount_percent),
        stock_quantity = COALESCE($17, stock_quantity),
        low_stock_threshold = COALESCE($18, low_stock_threshold),
        is_available = COALESCE($19, is_available),
        is_featured = COALESCE($20, is_featured),
        is_active = COALESCE($21, is_active),
        specifications = CASE WHEN $22::jsonb IS NOT NULL THEN $22::jsonb ELSE specifications END,
        warranty_info = COALESCE($23, warranty_info),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *`,
      [
        data.category_id,
        data.brand_id,
        data.name_ar,
        data.name_en,
        data.sku,
        data.description_ar,
        data.description_en,
        data.image_url,
        data.images ? JSON.stringify(data.images) : null,
        data.pricing_mode,
        data.base_cost,
        data.base_currency,
        data.profit_margin_percent,
        data.manual_egp_price,
        data.old_price !== undefined ? data.old_price : existing.old_price,
        data.discount_percent,
        data.stock_quantity,
        data.low_stock_threshold,
        data.is_available,
        data.is_featured,
        data.is_active,
        data.specifications ? JSON.stringify(data.specifications) : null,
        data.warranty_info,
        id,
      ]
    );

    const updated = res.rows[0];

    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'PRODUCT_UPDATED',
        entityType: 'PRODUCT',
        entityId: id,
        metadata: {
          sku: updated.sku,
          priceChanges: {
            old_mode: existing.pricing_mode,
            new_mode: updated.pricing_mode,
            old_manual: existing.manual_egp_price,
            new_manual: updated.manual_egp_price,
            old_stock: existing.stock_quantity,
            new_stock: updated.stock_quantity,
          },
        },
      });
    }

    return updated;
  }

  /**
   * Admin: Delete or deactivate product.
   */
  async deleteProduct(id: string, adminUserId?: string): Promise<void> {
    await query('UPDATE products_new SET is_active = FALSE WHERE id = $1', [id]);
    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'PRODUCT_DEACTIVATED',
        entityType: 'PRODUCT',
        entityId: id,
      });
    }
  }

  /**
   * Admin: Category CRUD
   */
  async createCategory(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const slug = data.slug || data.name_en?.toLowerCase().replace(/\s+/g, '-') || `cat-${Date.now()}`;
    const res = await query<CategoryEntity>(
      `INSERT INTO categories_new (name_ar, name_en, slug, image_url, icon_name, sort_order, is_featured, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.name_ar,
        data.name_en || data.name_ar,
        slug,
        data.image_url || null,
        data.icon_name || null,
        data.sort_order || 0,
        data.is_featured ?? false,
        data.is_active ?? true,
      ]
    );
    return res.rows[0];
  }

  async updateCategory(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const res = await query<CategoryEntity>(
      `UPDATE categories_new SET
        name_ar = COALESCE($1, name_ar),
        name_en = COALESCE($2, name_en),
        slug = COALESCE($3, slug),
        image_url = COALESCE($4, image_url),
        icon_name = COALESCE($5, icon_name),
        sort_order = COALESCE($6, sort_order),
        is_featured = COALESCE($7, is_featured),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [
        data.name_ar,
        data.name_en,
        data.slug,
        data.image_url,
        data.icon_name,
        data.sort_order,
        data.is_featured,
        data.is_active,
        id,
      ]
    );
    return res.rows[0];
  }

  async deleteCategory(id: string): Promise<void> {
    await query('UPDATE categories_new SET is_active = FALSE WHERE id = $1', [id]);
  }
}

export const productRepository = new ProductRepository();
