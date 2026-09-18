-- ==============================================================================
-- Hyper Technology Store - Sample Electronics Catalog Seed Data
-- ==============================================================================

-- 1. Categories
INSERT INTO categories_new (id, name_ar, name_en, slug, icon_name, sort_order, is_featured, is_active)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'الشاشات والتلفزيونات', 'Screens & TVs', 'screens-tvs', 'Tv', 1, TRUE, TRUE),
  ('c2222222-2222-2222-2222-222222222222', 'كاميرات المراقبة والأنظمة الأمنية', 'Security & CCTV Cameras', 'security-cameras', 'Camera', 2, TRUE, TRUE),
  ('c3333333-3333-3333-3333-333333333333', 'أجهزة التسجيل DVR & NVR', 'DVR & NVR Systems', 'dvr-nvr-systems', 'HardDrive', 3, TRUE, TRUE),
  ('c4444444-4444-4444-4444-444444444444', 'الشبكات والراوترات والمحولات', 'Networking, Routers & Switches', 'networking-routers', 'Wifi', 4, TRUE, TRUE),
  ('c5555555-5555-5555-5555-555555555555', 'إكسسوارات الكمبيوتر والكهربائيات', 'Computer & Electrical Accessories', 'computer-accessories', 'Cpu', 5, TRUE, TRUE),
  ('c6666666-6666-6666-6666-666666666666', 'الكابلات ومزودات الطاقة', 'Cables & Power Supplies', 'cables-power', 'Zap', 6, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  slug = EXCLUDED.slug,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active;

-- 2. Brands
INSERT INTO brands (id, name, slug, is_active)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Hikvision', 'hikvision', TRUE),
  ('b2222222-2222-2222-2222-222222222222', 'Dahua', 'dahua', TRUE),
  ('b3333333-3333-3333-3333-333333333333', 'TP-Link', 'tp-link', TRUE),
  ('b4444444-4444-4444-4444-444444444444', 'Samsung', 'samsung', TRUE),
  ('b5555555-5555-5555-5555-555555555555', 'LG', 'lg', TRUE),
  ('b6666666-6666-6666-6666-666666666666', 'Cisco', 'cisco', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO products_new (
  id, category_id, brand_id, name_ar, name_en, sku, description_ar, description_en,
  image_url, images,
  pricing_mode, base_cost, base_currency, profit_margin_percent, manual_egp_price, old_price, discount_percent,
  stock_quantity, low_stock_threshold, is_available, is_featured, is_active, specifications, warranty_info
)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'كاميرا مراقبة هيكفيجن 5 ميجابكسل رؤية ليلية ملونة ColorVu',
    'Hikvision 5MP ColorVu Audio Fixed Mini Bullet Camera',
    'HIK-5MP-CV-01',
    'كاميرا مراقبة خارجية فائقة الوضوح بدقة 5 ميجابكسل، تدعم التصوير الليلي الملون على مدار الساعة 24/7 مع مايك مدمج لتسجيل الصوت وهيكل مقاوم للعوامل الجوية بمعيار IP67.',
    'High resolution 5MP outdoor bullet camera with 24/7 full color imaging and built-in mic.',
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'USD_LINKED',
    35.00,
    'USD',
    18.00,
    0.00,
    2450.00,
    10.00,
    25,
    5,
    TRUE,
    TRUE,
    TRUE,
    '{"الدقة": "5 ميجابكسل (2560x1944)", "الرؤية الليلية": "تصوير ملون 24/7 حتى 30 متر", "مقاومة الماء": "معيار IP67", "الصوت": "ميكروفون مدمج عالي الحساسية", "العدسة": "2.8 مم زاوية واسعة"}'::jsonb,
    'ضمان سنتين معتمد من الوكيل الرسمي وباش مهندس أحمد السيد'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222',
    'جهاز تسجيل داهوا XVR 8 قنوات بدقة 4K مع تقنية الذكاء الاصطناعي WizSense',
    'Dahua 8 Channel WizSense 4K XVR Digital Video Recorder',
    'DH-XVR-8CH-4K',
    'جهاز تسجيل احترافي 8 قنوات يدعم كاميرات حتى دقة 8 ميجابكسل (4K)، مع ميزات التعرف الذكي على الأشخاص والمركبات ودعم ضغط الفيديو H.265+ لتوفير مساحة التخزين.',
    '8 Channel 4K XVR with AI WizSense human and vehicle detection.',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'USD_LINKED',
    75.00,
    'USD',
    15.00,
    0.00,
    4900.00,
    0.00,
    12,
    3,
    TRUE,
    TRUE,
    TRUE,
    '{"عدد القنوات": "8 قنوات فيديو + قنوات IP", "أقصى دقة": "4K Ultra HD", "الذكاء الاصطناعي": "كشف ذكي وتحديد الوجه والمركبات", "سعة الهارد": "يدعم حتى 10 تيرابايت SATA", "المنافذ": "HDMI (4K) + VGA + LAN + 2x USB"}'::jsonb,
    'ضمان 24 شهراً مع دعم فني وبرمجة مجانية'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'c1111111-1111-1111-1111-111111111111',
    'b4444444-4444-4444-4444-444444444444',
    'شاشة سامسونج سمارت 55 بوصة بدقة 4K UHD مع ريسيفر داخلي',
    'Samsung 55 Inch 4K UHD Smart TV with Built-in Receiver',
    'SAM-TV-55-4K',
    'شاشة تلفزيون ذكية فائقة الدقة 55 بوصة من سامسونج بمعالج Crystal Processor 4K ونظام Tizen OS، توفر ألواناً زاهية وتدعم جميع تطبيقات المشاهدة والاتصال اللاسلكي.',
    'Samsung 55 inch Crystal 4K Smart TV with HDR10+ and AirPlay support.',
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'FIXED_EGP',
    0.00,
    'EGP',
    0.00,
    18900.00,
    21500.00,
    12.00,
    8,
    2,
    TRUE,
    TRUE,
    TRUE,
    '{"حجم الشاشة": "55 بوصة", "الدقة": "3840x2160 (4K UHD)", "النظام": "Tizen Smart TV", "المنافذ": "3x HDMI, 2x USB, LAN, Optical", "الصوت": "Dolby Digital Plus قدرة 20 واط"}'::jsonb,
    'ضمان سنتين من سامسونج مصر'
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'c4444444-4444-4444-4444-444444444444',
    'b3333333-3333-3333-3333-333333333333',
    'راوتر تي بي لينك Archer AX12 واي فاي 6 ثنائي النطاق سرعة 1500 ميجابت',
    'TP-Link Archer AX12 Dual-Band Wi-Fi 6 Router 1500Mbps',
    'TPL-AX12-WF6',
    'راوتر متطور بتقنية Wi-Fi 6 لسرعات فائقة وتغطية واسعة مع 4 هوائيات عالية الكفاءة وتقنية OFDMA لدعم اتصال عشرات الأجهزة في وقت واحد دون بطء.',
    'Next-gen WiFi 6 gigabit router for uninterrupted 4K streaming and high performance.',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'FIXED_EGP',
    0.00,
    'EGP',
    0.00,
    1450.00,
    1700.00,
    15.00,
    30,
    6,
    TRUE,
    TRUE,
    TRUE,
    '{"السرعة": "1201 ميجابت على 5GHz + 300 ميجابت على 2.4GHz", "المعايير": "Wi-Fi 6 (802.11ax)", "الهوائيات": "4 هوائيات خارجية Beamforming", "المنافذ": "4 منافذ Gigabit Ethernet", "الأمان": "بروتوكول WPA3 الأحدث"}'::jsonb,
    'ضمان استبدال سنة كاملة'
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    'c6666666-6666-6666-6666-666666666666',
    NULL,
    'لفة كابل شبكة Cat6 نحاس نقي 100% طول 305 متر ماركة معتمدة',
    'Cat6 Pure Copper UTP Solid Network Cable 305m Drum',
    'CBL-CAT6-305M',
    'كابل شبكة إيثرنت احترافي من النحاس الخالص 100% لنقل الإشارة بأقصى سرعة واستقرار، مناسب لتمديدات كاميرات المراقبة والشبكات المؤسسية والمنازل.',
    'Pure copper Cat6 UTP 305m cable roll for high performance CCTV and LAN networks.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"]'::jsonb,
    'FIXED_EGP',
    0.00,
    'EGP',
    0.00,
    2850.00,
    3200.00,
    11.00,
    15,
    3,
    TRUE,
    FALSE,
    TRUE,
    '{"الطول": "305 متر (1000 قدم)", "النوع": "Cat6 UTP Solid 23AWG", "المادة": "نحاس نقي 100% بدون ألومنيوم", "السرعة المدعومة": "حتى 10 جيجابت", "الاستخدام": "داخلي وخارجي"}'::jsonb,
    'مطابق للمواصفات القياسية للجودة'
  )
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  description_ar = EXCLUDED.description_ar,
  specifications = EXCLUDED.specifications,
  warranty_info = EXCLUDED.warranty_info;

-- 4. Carousel Slides
INSERT INTO carousel_slides (id, title_ar, title_en, subtitle_ar, subtitle_en, image_url, button_text_ar, sort_order, is_active)
VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'أنظمة كاميرات المراقبة الذكية ColorVu',
    'Smart ColorVu CCTV Systems',
    'أحدث كاميرات المراقبة بالرؤية الليلية الملونة والذكاء الاصطناعي مع ضمان معتمد وتركيب احترافي بالسويس',
    '24/7 Full Color surveillance cameras with certified warranty in Suez',
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
    'تصفح الكاميرات',
    1,
    TRUE
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'شاشات التلفزيون بدقة 4K بأفضل الأسعار',
    '4K Ultra HD Smart Screens',
    'أقوى العروض على شاشات سامسونج وإل جي مع إمكانية الدفع عبر إنستاباي أو فودافون كاش أو عند الاستلام',
    'Top TV screens with flexible payment via InstaPay and Vodafone Cash',
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80',
    'عروض الشاشات',
    2,
    TRUE
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'حلول الشبكات والراوترات Wi-Fi 6 فائقة السرعة',
    'High Speed Networking & Wi-Fi 6 Routers',
    'أجهزة تي بي لينك وسيسكو لربط المنازل والمؤسسات بأعلى استقرار وسرعة نقل بيانات',
    'Enterprise and home networking solutions with technical support',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    'قسم الشبكات',
    3,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  title_ar = EXCLUDED.title_ar,
  subtitle_ar = EXCLUDED.subtitle_ar,
  button_text_ar = EXCLUDED.button_text_ar;
