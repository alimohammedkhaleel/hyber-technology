-- ==============================================================================
-- Hyper Technology Store - Electronics E-Commerce Platform
-- Migration 005: Consolidated Electronics Store Schema
-- Engine: PostgreSQL / Neon Compatible
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE (Electronics Categories)
CREATE TABLE IF NOT EXISTS categories_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    image_url TEXT,
    icon_name VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. BRANDS TABLE
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS TABLE (Dynamic Electronics Catalog with Dual Pricing)
CREATE TABLE IF NOT EXISTS products_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories_new(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    image_url TEXT,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    pricing_mode VARCHAR(20) NOT NULL DEFAULT 'FIXED_EGP' CHECK (pricing_mode IN ('FIXED_EGP', 'USD_LINKED')),
    base_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (base_cost >= 0.00),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'EGP' CHECK (base_currency IN ('EGP', 'USD')),
    profit_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (profit_margin_percent >= 0.00),
    manual_egp_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (manual_egp_price >= 0.00),
    old_price NUMERIC(12, 2) CHECK (old_price >= 0.00),
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 3,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    warranty_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. EXCHANGE RATES TABLE (Daily USD/EGP Historical Rates)
CREATE TABLE IF NOT EXISTS exchange_rates (
    id BIGSERIAL PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    to_currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
    rate NUMERIC(12, 4) NOT NULL CHECK (rate > 0),
    effective_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) NOT NULL DEFAULT 'SYSTEM_DEFAULT',
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. CAROUSEL SLIDES (Dynamic Hero Product Slides)
CREATE TABLE IF NOT EXISTS carousel_slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    subtitle_ar TEXT,
    subtitle_en TEXT,
    image_url TEXT NOT NULL,
    button_text_ar VARCHAR(100) DEFAULT 'تصفح الآن',
    link_url VARCHAR(255),
    product_id UUID REFERENCES products_new(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories_new(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. STORE SETTINGS & PAYMENT INSTRUCTIONS
CREATE TABLE IF NOT EXISTS store_settings (
    id SERIAL PRIMARY KEY,
    store_name_ar VARCHAR(150) NOT NULL DEFAULT 'متجر هايبر تكنولوجي',
    store_name_en VARCHAR(150) NOT NULL DEFAULT 'Hyper Technology Store',
    supervisor_name_ar VARCHAR(150) NOT NULL DEFAULT 'باش مهندس أحمد السيد',
    phone VARCHAR(30) NOT NULL DEFAULT '01017719898',
    address_ar TEXT NOT NULL DEFAULT 'السويس - السلام 1، موجود مباشرة أمام أسواق رمضان، شارع المعهد الهندسي، وخلف صيدلية محمد علي',
    working_hours_ar VARCHAR(255) NOT NULL DEFAULT 'يومياً من 10:00 صباحاً حتى 11:00 مساءً',
    cod_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    instapay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    instapay_info TEXT NOT NULL DEFAULT 'يرجى تحويل إجمالي المبلغ عبر تطبيق InstaPay إلى المعرف 01017719898@instapay أو رقم الهاتف 01017719898 ثم تسجيل الرقم المرجعي للعملية أدناه.',
    vodafone_cash_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    vodafone_cash_info TEXT NOT NULL DEFAULT 'يرجى تحويل المبلغ عبر فودافون كاش إلى الرقم: 01017719898 ثم إدخال رقم المعاملة ورقم المحفظة التي قمت بالتحويل منها.',
    usd_egp_rate_auto_update BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS carts_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (customer_id)
);

CREATE TABLE IF NOT EXISTS cart_items_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts_store(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products_new(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, product_id)
);

-- 8. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS store_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0.00),
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0.00),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0.00),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0.00),
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('CASH_ON_DELIVERY', 'INSTAPAY', 'VODAFONE_CASH')),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAYMENT_PENDING', 'PAYMENT_VERIFICATION', 'PAID', 'FAILED', 'CANCELLED', 'REJECTED', 'REFUNDED')),
    payment_reference VARCHAR(128),
    payer_phone VARCHAR(30),
    payment_proof_url TEXT,
    payment_verified_at TIMESTAMPTZ,
    payment_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_verification_notes TEXT,
    order_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'PAYMENT_VERIFICATION', 'CONFIRMED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED')),
    exchange_rate_used NUMERIC(12, 4),
    internal_admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products_new(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0.00),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0.00),
    pricing_mode_snapshot VARCHAR(20),
    base_currency_snapshot VARCHAR(3)
);

CREATE TABLE IF NOT EXISTS store_order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial Store Settings if empty
INSERT INTO store_settings (id, store_name_ar, store_name_en, supervisor_name_ar, phone, address_ar, working_hours_ar)
SELECT 1, 'متجر هايبر تكنولوجي', 'Hyper Technology Store', 'باش مهندس أحمد السيد', '01017719898', 'السويس - السلام 1، موجود مباشرة أمام أسواق رمضان، شارع المعهد الهندسي، وخلف صيدلية محمد علي', 'يومياً من 10:00 صباحاً حتى 11:00 مساءً'
WHERE NOT EXISTS (SELECT 1 FROM store_settings WHERE id = 1);

-- Seed initial USD/EGP rate if empty (e.g. 48.50)
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, notes)
SELECT 'USD', 'EGP', 48.5000, 'INITIAL_BASELINE', 'سعر الصرف الافتراضي الأولي للمتجر'
WHERE NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'USD' AND to_currency = 'EGP');

-- Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products_new(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products_new(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products_new(sku);
CREATE INDEX IF NOT EXISTS idx_products_active_avail ON products_new(is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective ON exchange_rates(effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_customer ON store_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_store_orders_payment_status ON store_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON store_order_items(order_id);
