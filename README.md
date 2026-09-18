# منصة إن إل بي للخدمات المتعددة | NLP SuperApp

> **المرحلة الأولى / 4 — التأسيس، المعمارية، قاعدة البيانات، والتطبيق الأساسي**  
> **PROJECT 1 / 4 — FOUNDATION, ARCHITECTURE, DATABASE & CORE APPLICATION**

منصة طلبات وخدمات متعددة حقيقية ومبنية للإنتاج من الصفر (Multi-Service Ordering Platform) تشمل طلبات الطعام والمطاعم، السوبرماركت والبقالة، التوصيل السريع، حجز القاعات والمناسبات، وحجز المواعيد الطبية، مع معمارية قابلة للتوسع ومجهزة بالكامل.

هذا المشروع **ليس تطبيقاً تجريبياً (NOT a demo)** ولا نموذجاً أولياً (NOT a prototype). المعمارية مبنية بالكامل وفق معايير أنظمة المؤسسات الحقيقية (Enterprise Architecture).

---

## 1. حزمة التقنيات المعتمدة (Technology Stack)

### الواجهة الأمامية (Frontend):
- **React 18** مع **TypeScript**
- **GSAP 3** للتحريك وشاشة العرض التقديمي (Brush Mask Wipe Presentation)
- **Framer Motion** للحركات الدقيقة
- **CSS النقي ومنظومة Tokens المخصصة** (مع الالتزام الصارم بعدم استخدام Tailwind CSS)
- **Lucide React** للأيقونات الاحترافية (صفر إيموجي بصورة قطعية)
- **RTL First** دعم أصيل للغة العربية

### الخادم الخلفي (Backend):
- **Node.js** & **Express.js** مع **TypeScript**
- معمارية طبقية متكاملة: `Routes -> Controllers -> Services -> Repositories -> Database`
- **Bcrypt** لتشفير كلمات المرور
- **JSON Web Tokens (JWT)** لإدارة الجلسات
- **Helmet & CORS** للحماية والترويسات الأمنية
- **Rate Limiting** للوقاية من هجمات التخمين

### قاعدة البيانات (Database):
- **PostgreSQL / Neon PostgreSQL**
- الاتصال يتم عبر متغير البيئة `DATABASE_URL` على الخادم فقط مع تشفير SSL (`rejectUnauthorized: false`)
- أنواع بيانات مالية دقيقة `NUMERIC(12, 2)` بدلاً من `FLOAT`
- تكامل العلاقات والمفاتيح الخارجية والفهارس وسجلات التدقيق

---

## 2. شاشة العرض التقديمي (GSAP Brush Presentation)

تتضمن المنصة شاشة عرض تمهيدي تفاعلية متطابقة تماماً مع الأسلوب الفخم لمشروع مؤسسة الشيخ:
- مسار فرشاة SVG Mask يتم رسمه ومسحه ديناميكياً باستخدام GSAP Timeline (`strokeDasharray`, `strokeDashoffset`).
- إظهار الشعار الرسمي للمشروع (NLP Logo المرفق من قِبلكم) بهالة إضاءة ذهبية فخمة (`drop-shadow(0 0 35px rgba(201, 162, 39, 0.55))`).
- عناوين الهوية الموحدة مع تدرج لوني بين الأبيض والذهب (`#ffffff` و `#c9a227`).
- انتقال انسيابي للكشف عن التطبيق الأساسي عند الانتهاء مع إمكانية التخطي أو إعادة العرض من الشريط العلوي.

---

## 3. مجالات قاعدة البيانات (24 جدولاً علائقياً)

1. **الهوية والصلاحيات (Identity & RBAC):**
   `roles`, `permissions`, `role_permissions`, `users`, `user_roles`
2. **العملاء (Customers):**
   `customer_profiles`, `customer_addresses`
3. **الشركاء والمتاجر (Vendors):**
   `service_categories`, `vendors`, `vendor_branches`
4. **المطاعم (Restaurants):**
   `restaurants`, `restaurant_categories`, `restaurant_hours`
5. **الكتالوج والمنتجات (Products Catalog):**
   `categories`, `products`, `product_variants`, `product_addons`
6. **الطلبات والسلات (Orders):**
   `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`
7. **التوصيل والمناديب (Delivery):**
   `delivery_assignments`, `delivery_status_history`
8. **الحجوزات والمواعيد (Bookings):**
   `booking_types`, `availability_slots`, `bookings`
9. **المدفوعات (Payments):**
   `payments`, `payment_transactions`, `refunds`
10. **التدقيق والإشعارات (Audit & Notifications):**
    `audit_logs`, `notifications`

---

## 4. تجهيز بوابة الدفع Paymob (Payment Abstraction)

- تم بناء طبقة تجريد معزولة:
  ```
  PaymentProvider (Interface)
        ↓
  PaymobProvider (Adapter)
        ↓
  PaymentService (Orchestrator)
  ```
- **التزام صارم:** لم يتم اختراع أو توليد أي مفاتيح أو معرفات وهمية لبوابة Paymob.
- عند استخراج بيانات الاعتماد الحقيقية لحساب Paymob، يكفي وضعها في ملف `.env`:
  ```env
  PAYMOB_API_KEY=your_real_key
  PAYMOB_INTEGRATION_ID=your_id
  PAYMOB_IFRAME_ID=your_iframe
  PAYMOB_HMAC_SECRET=your_hmac
  ```
  وسيعمل الربط فوراً دون تعديل كود المعمارية.

---

## 5. تشغيل المشروع محلياً (How to Run)

### المتطلبات الأساسية:
- Node.js إصدار 18 فما فوق
- npm

### 1. تثبيت الحزم لكافة أجزاء المشروع:
```bash
npm run install:all
```
*(أو الدخول إلى كل مجلد وتنفيذ `npm install`)*

### 2. ضبط متغيرات البيئة:
قم بنسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```
وقم بوضع رابط قاعدة بيانات Neon الخاص بك في المتغير:
```env
DATABASE_URL=postgresql://username:password@ep-example.region.aws.neon.tech/dbname?sslmode=require
```

### 3. تشغيل تهجير قاعدة البيانات (Migrations & Seeds):
```bash
npm run migrate
npm run seed
```

### 4. تشغيل المشروع بالكامل (العميل والخادم معاً):
```bash
npm run dev
```

- رابط واجهة المستخدم: `http://localhost:5173`
- رابط الخادم الخلفي: `http://localhost:5000`
- فحص صحة النظام والخادم: `http://localhost:5000/api/v1/health`

---

## 6. التحقق من اشتراطات المرحلة الأولى

- [x] الواجهة تعمل بـ React + TypeScript + GSAP + Framer Motion.
- [x] السيرفر يعمل بـ Node.js + Express + TypeScript بنظام REST API.
- [x] قاعدة بيانات Neon PostgreSQL مجهزة برابط بيئة محمي على السيرفر فقط.
- [x] جداول قاعدة البيانات (24 جدولاً) مكتملة القيود والفهارس والأنواع المالية `NUMERIC(12, 2)`.
- [x] التزام صارم بعدم وجود أي إيموجي (Zero Emojis) في واجهات المستخدم.
- [x] التزام صارم بعدم وجود بيانات تجريبية وهمية (No fake demo data/switching).
- [x] معمارية Paymob مجهزة كطبقة تجريد دون ادعاء الاتصال أو اختراع مفاتيح وهمية.
- [x] شاشة العرض التقديمي (Presentation) متطابقة مع مؤسسة الشيخ بشعار NLP والمسح بالفرشاة.
