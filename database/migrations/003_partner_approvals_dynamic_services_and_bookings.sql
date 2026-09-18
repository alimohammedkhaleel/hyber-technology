-- ==============================================================================
-- NLP SuperApp - Multi-Service Ordering Platform
-- Database Migration 003: Partner Approvals, Dynamic Services, Bookings & Moderation
-- ==============================================================================

-- 1. Extend vendors table with approval workflow and commercial registration fields
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_status_check 
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ACTIVE', 'INACTIVE'));

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS commercial_reg VARCHAR(50),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 2. Extend products table with approval status, rejection reasons, and pending changes
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED'
    CHECK (approval_status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS pending_changes JSONB;

-- 3. Extend booking_types (services) with approval status, capacity, and settings
ALTER TABLE booking_types
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED'
    CHECK (approval_status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS pending_changes JSONB,
  ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 1 CHECK (capacity > 0),
  ADD COLUMN IF NOT EXISTS buffer_minutes INT NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  ADD COLUMN IF NOT EXISTS auto_confirm BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Dynamic Vendor Availability Schedules (Working hours, slot durations, break times)
CREATE TABLE IF NOT EXISTS vendor_availability_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
    break_start_time TIME,
    break_end_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_schedule_times CHECK (start_time < end_time)
);

-- 5. Vendor Blocked Dates (Holidays, emergency closures, maintenance)
CREATE TABLE IF NOT EXISTS vendor_blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (vendor_id, block_date)
);

-- 6. Moderation History & Audit Trail (Tracking Admin reviews of partners, products, and services)
CREATE TABLE IF NOT EXISTS moderation_history (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL, -- VENDOR, PRODUCT, SERVICE, CATEGORY, BOOKING
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL, -- SUBMIT, APPROVE, REJECT, SUSPEND, REQUEST_CHANGES, REACTIVATE
    previous_status VARCHAR(64),
    new_status VARCHAR(64),
    reason TEXT,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Indexes for Fast Filtering & Moderation Queues
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_booking_types_approval ON booking_types(approval_status);
CREATE INDEX IF NOT EXISTS idx_availability_schedules_vendor ON vendor_availability_schedules(vendor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_vendor_date ON vendor_blocked_dates(vendor_id, block_date);
CREATE INDEX IF NOT EXISTS idx_moderation_history_entity ON moderation_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_history_created ON moderation_history(created_at DESC);
