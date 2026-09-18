-- ==============================================================================
-- NLP SuperApp - Multi-Service Ordering Platform
-- Database Seed 001: Core System Roles, Permissions, and Service Categories
-- ==============================================================================

-- 1. Seed Service Categories (Extensible Multi-Service Platform Architecture)
INSERT INTO service_categories (code, name_ar, name_en, description, is_active)
VALUES
    ('FOOD', 'طلب طعام ومطاعم', 'Food & Restaurants', 'خدمات طلب الأطعمة وتوصيل الوجبات من المطاعم', TRUE),
    ('GROCERY', 'بقالة ومواد غذائية', 'Grocery & Supermarket', 'تسوق السوبرماركت ومستلزمات البقالة اليومية', TRUE),
    ('PRODUCTS', 'منتجات ومتاجر تجزئة', 'Retail Products', 'تسوق السلع والمنتجات المتنوعة من المتاجر', TRUE),
    ('HALL_BOOKING', 'حجز قاعات ومناسبات', 'Venues & Halls Booking', 'خدمة حجز القاعات ومساحات الاجتماعات والمناسبات', TRUE),
    ('DOCTOR_BOOKING', 'حجز مواعيد واستشارات', 'Medical & Appointments', 'خدمة حجز المواعيد الطبية والعيادات والاستشارات', TRUE),
    ('DELIVERY', 'خدمات الشحن والتوصيل', 'Express Delivery', 'خدمات التوصيل السريع من نقطة إلى نقطة', TRUE),
    ('OTHER', 'خدمات أخرى', 'Other Services', 'فئة مخصصة لأي خدمات جديدة يتم توسعتها مستقبلاً', TRUE)
ON CONFLICT (code) DO UPDATE
SET name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description;

-- 2. Seed System Roles (RBAC Foundation - Server-side only, no client role switching)
INSERT INTO roles (code, name, description)
VALUES
    ('ADMIN', 'مدير النظام الكامل', 'صلاحيات كاملة لإدارة النظام، الإعدادات، والتقارير الرقابية'),
    ('MANAGER', 'مدير العمليات', 'إدارة العمليات اليومية، المطاعم، المتاجر، والتسويات المالية'),
    ('EMPLOYEE', 'موظف دعم وتشغيل', 'متابعة الطلبات الجارية وخدمة العملاء والدعم الفني'),
    ('VENDOR', 'صاحب المتجر / الشريك', 'إدارة المتجر، الفروع، المنتجات، وقوائم الأسعار'),
    ('RESTAURANT_STAFF', 'طاقم المطجر / المطعم', 'استلام وتجهيز الطلبات وتحديث حالتها التشغيلية'),
    ('DRIVER', 'مندوب التوصيل', 'استلام مهام التوصيل، التحديث الجغرافي، وتسليم الشحنات'),
    ('CUSTOMER', 'عميل المنصة', 'تصفح الخدمات، إدارة العناوين، إنشاء الطلبات، ومتابعة الدفع')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 3. Seed Standard Fine-Grained Permissions
INSERT INTO permissions (code, module, description)
VALUES
    ('system:manage', 'SYSTEM', 'إدارة إعدادات النظام ومراقبة المعمارية'),
    ('audit:view', 'AUDIT', 'الاطلاع على سجلات العمليات والتدقيق الأمني'),
    ('users:read', 'USERS', 'عرض المستخدمين وحساباتهم'),
    ('users:write', 'USERS', 'تعديل أو حظر المستخدمين وتعيين الأدوار'),
    ('services:manage', 'SERVICES', 'إدارة فئات الخدمات والكتالوج المركزي'),
    ('vendors:manage', 'VENDORS', 'اعتماد الشركاء وإدارة المتاجر والفروع'),
    ('products:manage', 'PRODUCTS', 'إضافة وتعديل المنتجات وقوائم الأسعار'),
    ('orders:view_all', 'ORDERS', 'عرض كافة الطلبات عبر جميع الفئات'),
    ('orders:manage', 'ORDERS', 'تحديث حالات الطلبات والموافقة على الإلغاءات'),
    ('delivery:dispatch', 'DELIVERY', 'تعيين المناديب ومتابعة مسار الشحنات'),
    ('delivery:update_status', 'DELIVERY', 'تحديث حالة التوصيل والتسليم الفعلي'),
    ('payments:view', 'PAYMENTS', 'عرض سجلات الدفع والمعاملات المالية'),
    ('payments:refund', 'PAYMENTS', 'تنفيذ عمليات استرداد المبالغ'),
    ('bookings:manage', 'BOOKINGS', 'إدارة المواعيد المتاحة والقاعات المخصصة')
ON CONFLICT (code) DO NOTHING;

-- 4. Map Permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;
