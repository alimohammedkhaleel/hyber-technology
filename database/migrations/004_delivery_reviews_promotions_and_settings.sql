-- ==============================================================================
-- NLP SuperApp - Multi-Service Ordering Platform
-- Database Migration 004: Delivery, Reviews, Promotions, and Business Settings
-- Engine: PostgreSQL (Neon Compatible)
-- ==============================================================================

-- 1. Update delivery_assignments Status Constraint
ALTER TABLE delivery_assignments 
    DROP CONSTRAINT IF EXISTS delivery_assignments_status_check;

ALTER TABLE delivery_assignments 
    ADD CONSTRAINT delivery_assignments_status_check 
    CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FAILED', 'CANCELLED'));

-- Add columns to delivery_assignments if not already present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_assignments' AND column_name = 'on_the_way_at') THEN
        ALTER TABLE delivery_assignments ADD COLUMN on_the_way_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_assignments' AND column_name = 'notes') THEN
        ALTER TABLE delivery_assignments ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_assignments' AND column_name = 'cancellation_reason') THEN
        ALTER TABLE delivery_assignments ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;

-- 2. Reviews and Ratings Table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.00;

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PUBLISHED', 'HIDDEN', 'REPORTED', 'FLAGGED')),
    moderation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraints to avoid duplicate reviews
CREATE UNIQUE INDEX IF NOT EXISTS uidx_reviews_customer_order 
    ON reviews(customer_id, order_id) 
    WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_reviews_customer_booking 
    ON reviews(customer_id, booking_id) 
    WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- 3. Promotions & Promo Codes
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0.00),
    max_discount_amount NUMERIC(10, 2),
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    per_user_limit INT NOT NULL DEFAULT 1,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    applicable_service_type VARCHAR(50),
    applicable_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_applied NUMERIC(10, 2) NOT NULL CHECK (discount_applied >= 0.00),
    used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_usages_promo_customer ON promotion_usages(promotion_id, customer_id);

-- 4. Business Platform Settings
CREATE TABLE IF NOT EXISTS business_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
