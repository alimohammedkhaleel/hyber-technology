-- ==============================================================================
-- Hyper Technology Store - Performance & High Speed Indexes
-- Migration 006: High-Concurrency & Full-Text Search Acceleration
-- ==============================================================================

-- 1. Composite Index for active, available, and featured products sorting
CREATE INDEX IF NOT EXISTS idx_products_active_avail_feat_created 
ON products_new(is_active, is_available, is_featured DESC, created_at DESC);

-- 2. Index for category and brand filtering with availability
CREATE INDEX IF NOT EXISTS idx_products_cat_brand_active 
ON products_new(category_id, brand_id, is_active);

-- 3. Composite Index for orders listing and customer queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_created 
ON store_orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON store_orders(order_status, created_at DESC);

-- 4. Fast category sort index
CREATE INDEX IF NOT EXISTS idx_categories_sort_active 
ON categories_new(is_active, sort_order ASC, name_ar ASC);

-- 5. Exchange rates effective lookup index
CREATE INDEX IF NOT EXISTS idx_exchange_rates_curr_effective 
ON exchange_rates(from_currency, to_currency, effective_at DESC, id DESC);
