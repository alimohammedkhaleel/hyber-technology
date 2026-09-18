-- ==============================================================================
-- NLP SuperApp - Multi-Service Ordering Platform
-- Database Migration 002: Customer Favorites & Order Items Enhancements
-- Engine: PostgreSQL (Neon Compatible)
-- ==============================================================================

-- 1. Create Customer Favorites Table (Vendors & Products)
CREATE TABLE IF NOT EXISTS customer_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_favorite_target CHECK (
        (vendor_id IS NOT NULL AND product_id IS NULL) OR
        (vendor_id IS NULL AND product_id IS NOT NULL)
    ),
    CONSTRAINT uq_customer_vendor UNIQUE (customer_id, vendor_id),
    CONSTRAINT uq_customer_product UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_vendor ON customer_favorites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_product ON customer_favorites(product_id);

-- 2. Enhance Cart Items to store selected Add-ons and Special Instructions
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- 3. Enhance Order Items to store selected Add-ons and Special Instructions
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS special_instructions TEXT;
