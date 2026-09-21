import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api/productService';
import { exchangeRateService } from '../../services/api/exchangeRateService';
import { carouselService } from '../../services/api/carouselService';
import { Product, ProductCategory, Brand, ExchangeRate, CarouselSlide } from '../../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_SLIDES,
} from '../../constants/initialCatalogData';
import { HeroCarousel } from '../../components/home/HeroCarousel';
import { ProductModal } from '../../components/product/ProductModal';
import { ProductImage } from '../../components/common/ProductImage';
import { useCart } from '../../context/CartContext';
import { BRANDING } from '../../config/branding';
import {
  Search,
  Tv,
  Camera,
  HardDrive,
  Wifi,
  Zap,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Award,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { SkeletonCard } from '../../components/feedback';
import './HomePage.css';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

// Fast session cache helper to eliminate network delay on internal navigation
const getSessionCache = () => {
  try {
    const raw = sessionStorage.getItem('hts_catalog_cache');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { addToCart } = useCart();
  const cached = getSessionCache();

  const [products, setProducts] = useState<Product[]>(cached?.products || INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<ProductCategory[]>(cached?.categories || INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(cached?.brands || INITIAL_BRANDS);
  const [slides, setSlides] = useState<CarouselSlide[]>(cached?.slides || INITIAL_SLIDES);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(cached?.exchangeRate || null);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionSuccessId, setActionSuccessId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const [productsData, categoriesData, brandsData, slidesData, rateData] = await Promise.all([
          productService.getProducts({}).catch(() => null),
          productService.getCategories().catch(() => null),
          productService.getBrands().catch(() => null),
          carouselService.getActiveSlides().catch(() => []),
          exchangeRateService.getCurrentRate().catch(() => null),
        ]);

        if (!isMounted) return;

        if (productsData && productsData.length > 0) {
          setProducts((prev) => {
            if (
              prev.length === productsData.length &&
              prev.every((p, i) => {
                const next = productsData[i];
                if (!next || p.id !== next.id) return false;
                const pPrice = p.pricing?.sellingPriceEgp ?? p.manual_egp_price ?? 0;
                const nPrice = next.pricing?.sellingPriceEgp ?? next.manual_egp_price ?? 0;
                return (
                  pPrice === nPrice &&
                  p.stock_quantity === next.stock_quantity &&
                  p.is_available === next.is_available &&
                  p.image_url === next.image_url
                );
              })
            ) {
              return prev;
            }
            return productsData;
          });
        }

        if (categoriesData && categoriesData.length > 0) {
          setCategories((prev) => {
            if (
              prev.length === categoriesData.length &&
              prev.every((c, i) => c.id === categoriesData[i]?.id && c.product_count === categoriesData[i]?.product_count)
            ) {
              return prev;
            }
            return categoriesData;
          });
        }

        if (brandsData && brandsData.length > 0) {
          setBrands((prev) => {
            if (
              prev.length === brandsData.length &&
              prev.every((b, i) => b.id === brandsData[i]?.id)
            ) {
              return prev;
            }
            return brandsData;
          });
        }

        if (slidesData && slidesData.length > 0) {
          setSlides((prev) => {
            if (
              prev.length === slidesData.length &&
              prev.every((s, i) => s.id === slidesData[i]?.id && s.image_url === slidesData[i]?.image_url && s.title_ar === slidesData[i]?.title_ar)
            ) {
              return prev;
            }
            return slidesData;
          });
        }

        if (rateData?.metadata) {
          setExchangeRate(rateData.metadata);
        } else if (rateData?.rate) {
          setExchangeRate({ rate: rateData.rate } as any);
        }

        // Cache the authoritative database data for instant subsequent routing
        if (productsData && productsData.length > 0) {
          try {
            sessionStorage.setItem(
              'hts_catalog_cache',
              JSON.stringify({
                products: productsData,
                categories: categoriesData || INITIAL_CATEGORIES,
                brands: brandsData || INITIAL_BRANDS,
                slides: slidesData || INITIAL_SLIDES,
                exchangeRate: rateData?.metadata || (rateData?.rate ? { rate: rateData.rate } : null),
              })
            );
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load home data, using fallback data:', err);
      }
    };

    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setActionSuccessId(product.id);
    setTimeout(() => {
      setActionSuccessId(null);
    }, 1800);
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'screens-tvs':
        return <Tv size={22} />;
      case 'security-cameras':
        return <Camera size={22} />;
      case 'dvr-nvr-systems':
        return <HardDrive size={22} />;
      case 'networking-routers':
        return <Wifi size={22} />;
      case 'cables-power':
      default:
        return <Zap size={22} />;
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category_id === selectedCategory ||
      p.category_slug === selectedCategory;

    const productName = p.name_ar || p.name || '';
    const matchesSearch =
      searchQuery.trim() === '' ||
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name_en && p.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="hts-home-page">
      <SEOHead
        title="الصفحة الرئيسية"
        description="متجر هايبر تكنولوجي (Hyper Technology) - وجهتك المتكاملة لجميع مستلزمات الإلكترونيات والشاشات وكاميرات المراقبة والشبكات في مصر تحت إشراف باش مهندس أحمد السيد."
        keywords="hyber technology, hyper technology, هايبر تكنولوجي, متجر هايبر تكنولوجي, باش مهندس احمد, شاشات, كاميرات مراقبة, السويس"
      />
      {/* 1. Hero Dynamic Visual Carousel */}
      <HeroCarousel slides={slides} onNavigate={onNavigate} />

      {/* 2. Store Highlights & Supervisor Banner */}
      <section className="hts-info-strip">
        <div className="hts-container strip-grid">
          <div className="strip-item">
            <div className="strip-icon-box">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>{BRANDING.supervisorAr}</strong>
              <span>إشراف وتوجيه هندسي مباشر</span>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <MapPin size={22} />
            </div>
            <div>
              <strong>المعرض الرئيسي: السويس</strong>
              <span>شحن وتوصيل لجميع محافظات مصر</span>
            </div>
          </div>

          <div className="strip-item">
            <div className="strip-icon-box">
              <Phone size={22} />
            </div>
            <div>
              <strong dir="ltr">{BRANDING.supportPhone}</strong>
              <span>مبيعات واستشارات فنية فورية</span>
            </div>
          </div>

          {exchangeRate && (
            <div className="strip-item rate-strip-item">
              <div className="strip-icon-box rate-box">
                <TrendingUp size={22} />
              </div>
              <div>
                <strong>تسعير شفاف لحظي</strong>
                <span>سعر الدولار اليوم: {Number(exchangeRate.rate).toFixed(2)} ج.م</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Categories Navigation Bar */}
      <section className="hts-categories-section">
        <div className="hts-container">
          <div className="section-title-wrap">
            <div className="title-tag">
              <Layers size={16} />
              <span>الأقسام الرئيسية المتخصصة</span>
            </div>
            <h2 className="section-main-title">اختر القسم واستكشف أفضل التقنيات</h2>
          </div>

          <div className="categories-badges-scroll">
            <button
              type="button"
              className={`cat-nav-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              <Sparkles size={18} />
              <span>جميع المنتجات ({products.length})</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-nav-pill ${selectedCategory === cat.id || selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {getCategoryIcon(cat.slug)}
                <span>{cat.name_ar || cat.name}</span>
                {cat.product_count !== undefined && (
                  <span className="cat-count-badge">{cat.product_count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Products Search & Catalog Section */}
      <section className="hts-products-catalog-section" id="products-catalog">
        <div className="hts-container">
          {/* Search & Filter Header */}
          <div className="catalog-header-bar">
            <div className="catalog-search-wrap">
              <Search size={18} className="search-icon-inside" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الموديل، الماركة (سامسونج، داهوا، هايكفيجن...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="catalog-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  مسح
                </button>
              )}
            </div>

            <div className="catalog-count-label">
              <span>المعروض: </span>
              <strong>{filteredProducts.length} منتج</strong>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="products-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <SkeletonCard key={n} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-catalog-box">
              <AlertCircle size={48} className="gold-text" />
              <h3>لا توجد منتجات مطابقة لبحثك</h3>
              <p>جرّب البحث باسم منتج آخر أو اختر قسماً مختلفاً من القائمة بالأعلى.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const effectivePrice =
                  product.pricing?.sellingPriceEgp ||
                  product.manual_egp_price ||
                  product.calculated_price_egp ||
                  product.base_price ||
                  0;
                const isOutOfStock = !product.is_available || product.stock_quantity <= 0;
                const isAdded = actionSuccessId === product.id;
                const displayName = product.name_ar || product.name || '';
                const displayImg = product.image_url || product.main_image_url || '/placeholder-device.png';

                return (
                  <div
                    key={product.id}
                    className={`hts-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Card Badges */}
                    <div className="card-top-badges">
                      {product.brand_name && (
                        <span className="badge-brand">{product.brand_name}</span>
                      )}
                      {product.pricing_mode === 'USD_LINKED' && (
                        <span className="badge-usd-linked">سعر مرتبط بالدولار</span>
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="card-image-wrap">
                      <ProductImage
                        src={product.image_url || product.main_image_url}
                        alt={displayName}
                        categorySlug={product.category_slug}
                        categoryName={product.category_name_ar || product.category_name}
                        className="card-main-image"
                        loading="lazy"
                      />
                      {isOutOfStock && (
                        <div className="out-of-stock-overlay">
                          <span>نفد من المخزن</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="card-body">
                      <div className="card-category-tag">
                        {product.category_name_ar || product.category_name}
                      </div>
                      <h3 className="card-product-title" title={displayName}>
                        {displayName}
                      </h3>

                      {product.warranty_info ? (
                        <div className="card-warranty-pill">
                          <Award size={14} />
                          <span>{product.warranty_info}</span>
                        </div>
                      ) : product.warranty_months ? (
                        <div className="card-warranty-pill">
                          <Award size={14} />
                          <span>ضمان معتمد {product.warranty_months} شهر</span>
                        </div>
                      ) : null}

                      {/* Specs snippet */}
                      {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <div className="card-specs-snippet">
                          {Object.entries(product.specifications).slice(0, 2).map(([k, v]) => (
                            <span key={k} className="spec-tag">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price & Cart Action */}
                      <div className="card-footer-row">
                        <div className="card-price-block">
                          <div className="effective-price">
                            <strong>{Number(effectivePrice).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong>
                            <span className="currency-label">ج.م</span>
                          </div>
                          {product.pricing_mode === 'USD_LINKED' && (product.usd_price || (product.base_currency === 'USD' && product.base_cost)) && (
                            <span className="usd-ref-price">
                              (${Number(product.usd_price || product.base_cost).toFixed(2)})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className={`card-add-cart-btn ${isAdded ? 'added' : ''}`}
                          disabled={isOutOfStock}
                          onClick={(e) => handleAddToCart(e, product)}
                          title={isOutOfStock ? 'غير متوفر' : 'أضف إلى سلة المشتريات'}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span>تمت الإضافة</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={16} />
                              <span>أضف للسلة</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. Physical Store Location & Engineering Trust Section */}
      <section className="hts-store-trust-section" id="store-location-section">
        <div className="hts-container">
          <div className="trust-grid">
            {/* Left: Engineering Supervision & Guarantee */}
            <div className="trust-text-card">
              <div className="trust-header-badge">
                <ShieldCheck size={18} />
                <span>ثقة وأمان هندسي متكامل</span>
              </div>

              <h3 className="trust-main-heading">
                لماذا يفضل العملاء في كافة محافظات مصر الشراء من <span className="gold-text">هايبر تكنولوجي</span>؟
              </h3>

              <p className="trust-lead-text">
                تحت إشراف باش مهندس أحمد السيد، نقدّم لعملائنا في كل مكان حلولاً هندسية متكاملة لجميع مستلزمات التكنولوجيا والإلكترونيات مع الشحن الآمن والضمان الحقيقي.
              </p>

              <div className="trust-features-list">
                <div className="trust-feature-item">
                  <div className="feature-icon-box">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>فحص وتجربة شاملة قبل الاستلام</strong>
                    <p>يتم اختبار جميع الشاشات والكاميرات وأجهزة التسجيل للتأكد من خلوها من أي عيوب مصنعية.</p>
                  </div>
                </div>

                <div className="trust-feature-item">
                  <div className="feature-icon-box">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>ضمان استبدال وصيانة معتمد</strong>
                    <p>ضمان حقيقي يشمل خدمات ما بعد البيع والدعم الفني المباشر لجميع الأجهزة.</p>
                  </div>
                </div>

                <div className="trust-feature-item">
                  <div className="feature-icon-box">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>استشارات واقتراحات تركيب مجانية</strong>
                    <p>مساعدتك في اختيار أنسب نظام مراقبة أو شاشة تناسب مساحة منزلك أو شركتك.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Location & Visit Card */}
            <div className="store-location-card">
              <div className="location-card-header">
                <MapPin size={24} className="gold-text" />
                <div>
                  <h4>مقر المعرض بمحافظة السويس</h4>
                  <span>مرحباً بكم لزيارتنا ومعاينة المنتجات على الطبيعة</span>
                </div>
              </div>

              <div className="location-address-box">
                <p>
                  <strong>العنوان بالتفصيل:</strong> {BRANDING.address}
                </p>
              </div>

              <div className="location-details-list">
                <div className="loc-detail-row">
                  <Phone size={18} />
                  <div>
                    <span>للتواصل الهاتفي والحجز:</span>
                    <strong dir="ltr" className="gold-text">{BRANDING.supportPhone}</strong>
                  </div>
                </div>

                <div className="loc-detail-row">
                  <Clock size={18} />
                  <div>
                    <span>مواعيد العمل الرسمية:</span>
                    <strong>يومياً من 10:00 صباحاً حتى 11:00 مساءً</strong>
                  </div>
                </div>
              </div>

              <div className="location-cta-actions">
                <a
                  href="https://wa.me/201017719898"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary location-call-btn"
                >
                  <Phone size={18} />
                  <span>تواصل على الواتس (م/ أحمد)</span>
                </a>

                <a
                  href={BRANDING.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary location-map-btn"
                >
                  <ExternalLink size={18} />
                  <span>الاتجاهات على الخريطة</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Product Quick Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
