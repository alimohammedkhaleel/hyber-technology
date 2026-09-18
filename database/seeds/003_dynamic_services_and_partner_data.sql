-- ==============================================================================
-- NLP SuperApp - Multi-Service Ordering Platform
-- Database Seed 003: Dynamic Availability Schedules & Booking Services
-- ==============================================================================

-- 1. Populate Availability Schedules for Clinic Vendor (50000000-0000-0000-0000-000000000001)
-- Working Saturday through Thursday: 09:00 to 21:00 with 30-minute consultation slots and break 14:00-15:00
INSERT INTO vendor_availability_schedules (vendor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start_time, break_end_time, is_active)
VALUES
    ('50000000-0000-0000-0000-000000000001', 0, '09:00', '21:00', 30, '14:00', '15:00', TRUE),
    ('50000000-0000-0000-0000-000000000001', 1, '09:00', '21:00', 30, '14:00', '15:00', TRUE),
    ('50000000-0000-0000-0000-000000000001', 2, '09:00', '21:00', 30, '14:00', '15:00', TRUE),
    ('50000000-0000-0000-0000-000000000001', 3, '09:00', '21:00', 30, '14:00', '15:00', TRUE),
    ('50000000-0000-0000-0000-000000000001', 4, '09:00', '21:00', 30, '14:00', '15:00', TRUE),
    ('50000000-0000-0000-0000-000000000001', 6, '09:00', '21:00', 30, '14:00', '15:00', TRUE)
ON CONFLICT DO NOTHING;

-- 2. Populate Availability Schedules for Pearl Grand Hall (40000000-0000-0000-0000-000000000001)
-- Working all days: 12:00 to 23:00 with 180-minute (3h) event slots
INSERT INTO vendor_availability_schedules (vendor_id, day_of_week, start_time, end_time, slot_duration_minutes, break_start_time, break_end_time, is_active)
VALUES
    ('40000000-0000-0000-0000-000000000001', 0, '12:00', '23:00', 180, NULL, NULL, TRUE),
    ('40000000-0000-0000-0000-000000000001', 1, '12:00', '23:00', 180, NULL, NULL, TRUE),
    ('40000000-0000-0000-0000-000000000001', 2, '12:00', '23:00', 180, NULL, NULL, TRUE),
    ('40000000-0000-0000-0000-000000000001', 3, '12:00', '23:00', 180, NULL, NULL, TRUE),
    ('40000000-0000-0000-0000-000000000001', 4, '12:00', '23:00', 180, NULL, NULL, TRUE),
    ('40000000-0000-0000-0000-000000000001', 5, '14:00', '23:00', 180, NULL, NULL, TRUE),
    ('40000000-0000-0000-0000-000000000001', 6, '12:00', '23:00', 180, NULL, NULL, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Populate Booking Services (booking_types) with approved status
INSERT INTO booking_types (id, vendor_id, service_type, title, description, duration_minutes, price, capacity, buffer_minutes, auto_confirm, is_active, approval_status, image_url)
VALUES
    ('c0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'DOCTOR_BOOKING', 'كشف واستشارة باطنة وطب أسرة', 'فحص شامل وتشخيص دقيق مع كتابة الخطة العلاجية ومتابعة الفحوصات', 30, 350.00, 1, 5, TRUE, TRUE, 'APPROVED', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80'),
    ('c0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'DOCTOR_BOOKING', 'استشارة تغذية علاجية وتنسيق قوام', 'وضع برنامج غذائي مخصص وفحص نسبة الدهون والكتلة العضلية', 45, 400.00, 1, 5, TRUE, TRUE, 'APPROVED', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80'),
    ('c0000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'HALL_BOOKING', 'حجز القاعة الملكية الكبرى (سعة 250 فرد)', 'قاعة مجهزة بالكامل بأحدث أنظمة الصوت والإضاءة والضيافة الفندقية الفاخرة', 180, 12000.00, 1, 30, FALSE, TRUE, 'APPROVED', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'),
    ('c0000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'HALL_BOOKING', 'حجز قاعة كبار الزوار والاجتماعات (سعة 40 فرد)', 'مجهزة بشاشات عرض ذكية وخدمة ضيافة مستمرة وخدمة إنترنت فائق السرعة', 120, 3500.00, 1, 15, TRUE, TRUE, 'APPROVED', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    price = EXCLUDED.price,
    approval_status = EXCLUDED.approval_status;

-- 4. Initial Moderation History Logs
INSERT INTO moderation_history (entity_type, entity_id, action, previous_status, new_status, reason, created_at)
VALUES
    ('VENDOR', '10000000-0000-0000-0000-000000000001', 'APPROVE', 'PENDING', 'APPROVED', 'تم استيفاء كافة التراخيص والاشتراطات الصحية بنجاح', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('VENDOR', '40000000-0000-0000-0000-000000000001', 'APPROVE', 'PENDING', 'APPROVED', 'تم التحقق من صور القاعات وتراخيص المنشأة', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('SERVICE', 'c0000000-0000-0000-0000-000000000001', 'APPROVE', 'PENDING_REVIEW', 'APPROVED', 'اعتماد خدمة الكشف والاستشارة الطبية', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('SERVICE', 'c0000000-0000-0000-0000-000000000003', 'APPROVE', 'PENDING_REVIEW', 'APPROVED', 'اعتماد حجز القاعة الملكية', CURRENT_TIMESTAMP - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- 5. Seed System Administrator User
INSERT INTO users (id, email, phone, password_hash, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@superapp.com', '+201000000001', '$2a$10$UIuB961nBV0gEVcDNVGEvOPUff0d/rBYXod320gasKYmy70nc6Oqy', 'ACTIVE')
ON CONFLICT (phone) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

INSERT INTO customer_profiles (id, user_id, full_name, phone, email, account_status)
VALUES
    ('ad000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'الإدارة المركزية للمنصة', '+201000000001', 'admin@superapp.com', 'ACTIVE')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000001', r.id
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

