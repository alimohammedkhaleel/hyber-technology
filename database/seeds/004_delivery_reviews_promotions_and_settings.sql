-- ==============================================================================
-- NLP SuperApp - Multi-Service Ordering Platform
-- Database Seed 004: Delivery Drivers, Promotions, Settings & Reviews
-- Engine: PostgreSQL (Neon Compatible)
-- ==============================================================================

-- 1. Seed Dedicated Delivery Driver User
INSERT INTO users (id, email, phone, password_hash, status)
VALUES
    ('d1111111-1111-1111-1111-111111111111', 'driver@superapp.com', '+201055556666', '$2a$10$UIuB961nBV0gEVcDNVGEvOPUff0d/rBYXod320gasKYmy70nc6Oqy', 'ACTIVE')
ON CONFLICT (phone) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

INSERT INTO customer_profiles (id, user_id, full_name, phone, email, account_status)
VALUES
    ('d0111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'كابتن محمود حسن مندور', '+201055556666', 'driver@superapp.com', 'ACTIVE')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'd1111111-1111-1111-1111-111111111111', r.id
FROM roles r
WHERE r.code = 'DRIVER'
ON CONFLICT DO NOTHING;

-- 2. Seed Standard Platform Promotions
INSERT INTO promotions (id, code, title, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, per_user_limit, start_date, end_date, is_active)
VALUES
    (
        'b1111111-1111-1111-1111-111111111111',
        'WELCOME50',
        'خصم ترحيبي 50 ج.م للطلب الأول',
        'خصم فوري بقيمة 50 جنيه مصري على أي طلب بقيمة 200 جنيه أو أكثر لجميع العملاء الجدد',
        'FIXED',
        50.00,
        200.00,
        50.00,
        10000,
        1,
        CURRENT_TIMESTAMP - INTERVAL '30 days',
        CURRENT_TIMESTAMP + INTERVAL '365 days',
        TRUE
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'WEEKEND20',
        'خصم عطلة نهاية الأسبوع 20%',
        'خصم 20% بحد أقصى 60 جنيه على طلبات المطاعم والمأكولات في عطلة نهاية الأسبوع',
        'PERCENTAGE',
        20.00,
        150.00,
        60.00,
        5000,
        3,
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        CURRENT_TIMESTAMP + INTERVAL '180 days',
        TRUE
    ),
    (
        'b3333333-3333-3333-3333-333333333333',
        'SUPERAPP10',
        'خصم خاص 10% على جميع المتاجر',
        'خصم عام 10% بدون حد أقصى على كافة المنتجات والمتاجر والخدمات',
        'PERCENTAGE',
        10.00,
        100.00,
        NULL,
        20000,
        5,
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        CURRENT_TIMESTAMP + INTERVAL '90 days',
        TRUE
    )
ON CONFLICT (code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    discount_value = EXCLUDED.discount_value,
    is_active = EXCLUDED.is_active;

-- 3. Seed Configurable Platform Business Settings
INSERT INTO business_settings (key, value, description)
VALUES
    ('platform_commission_rate', '{"percentage": 10, "label": "نسبة عمولة المنصة القياسية"}', 'النسبة المئوية المحصلة من إجمالي مبيعات الشركاء'),
    ('default_delivery_fee', '{"amount": 25.00, "currency": "EGP"}', 'رسوم التوصيل الأساسية الافتراضية داخل النطاق القياسي'),
    ('support_contact', '{"phone": "+201099998888", "email": "care@superapp.com", "hours": "24/7"}', 'بيانات التواصل الرسمية لخدمة العملاء والدعم الفني'),
    ('cancellation_policy', '{"order_window_minutes": 5, "booking_window_hours": 24}', 'المهلة الزمنية المسموح بها لإلغاء الطلبات أو المواعيد دون رسوم')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

-- 4. Seed Verified Customer Reviews
INSERT INTO reviews (customer_id, vendor_id, rating, comment, status)
VALUES
    (
        'd2222222-2222-2222-2222-222222222222',
        '10000000-0000-0000-0000-000000000001',
        5,
        'أفضل برجر تناولته على الإطلاق، اللحم طازج والخبز طري وساخن والتوصيل تم في وقت قياسي جداً.',
        'APPROVED'
    ),
    (
        'd2222222-2222-2222-2222-222222222222',
        '50000000-0000-0000-0000-000000000001',
        5,
        'دقة بالغة في مواعيد الكشف والعيادة نظيفة جداً والطبيب في غاية الاحترافية والاهتمام.',
        'APPROVED'
    ),
    (
        'd2222222-2222-2222-2222-222222222222',
        '40000000-0000-0000-0000-000000000001',
        5,
        'القاعة فخمة للغاية وتجهيزات الصوت والضيافة نالت إعجاب كافة الحضور في مناسبتنا الخاصة.',
        'APPROVED'
    )
ON CONFLICT DO NOTHING;
