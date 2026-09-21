import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api/productService';
import { Product, ProductCategory, Brand } from '../../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
} from '../../constants/initialCatalogData';
import { ProductModal } from '../../components/product/ProductModal';
import { ProductImage } from '../../components/common/ProductImage';
import { useCart } from '../../context/CartContext';
import {
  Search,
  Award,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { SkeletonCard } from '../../components/feedback';
import './ProductsPage.css';

interface ProductsPageProps {
  onNavigate: (path: string) => void;
  initialCategory?: string;
  initialSearch?: string;
}

// Fast session cache helper to eliminate network delay on internal navigation
const getSessionCache = () => {
  try {
    const raw = sessionStorage.getItem('hts_catalog_cache');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onNavigate,
  initialCategory,
  initialSearch,
}) => {
  const { addToCart } = useCart();
  const cached = getSessionCache();

  const [products, setProducts] = useState<Product[]>(cached?.products || INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<ProductCategory[]>(cached?.categories || INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(cached?.brands || INITIAL_BRANDS);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionSuccessId, setActionSuccessId] = useState<string | null>(null);

  // Sync with URL parameters
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('categoryId=')) {
      const catId = hash.split('categoryId=')[1]?.split('&')[0];
      if (catId) setSelectedCategory(catId);
    } else if (hash.includes('categorySlug=')) {
      const catSlug = hash.split('categorySlug=')[1]?.split('&')[0];
      if (catSlug) setSelectedCategory(catSlug);
    }
    if (hash.includes('search=')) {
      const s = decodeURIComponent(hash.split('search=')[1]?.split('&')[0] || '');
      if (s) setSearchQuery(s);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, brandsData] = await Promise.all([
          productService.getProducts({}).catch(() => null),
          productService.getCategories().catch(() => null),
          productService.getBrands().catch(() => null),
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

        // Cache the authoritative database data
        if (productsData && productsData.length > 0) {
          try {
            const currentCache = getSessionCache() || {};
            sessionStorage.setItem(
              'hts_catalog_cache',
              JSON.stringify({
                ...currentCache,
                products: productsData,
                categories: categoriesData || INITIAL_CATEGORIES,
                brands: brandsData || INITIAL_BRANDS,
              })
            );
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error fetching products, using fallback catalog:', err);
      }
    };

    fetchData();
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

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        p.category_id === selectedCategory ||
        p.category_slug === selectedCategory;

      const matchesBrand =
        selectedBrand === 'ALL' ||
        p.brand_id === selectedBrand ||
        p.brand_name === selectedBrand;

      const productName = p.name_ar || p.name || '';
      const matchesSearch =
        searchQuery.trim() === '' ||
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name_en && p.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesBrand && matchesSearch;
    })
    .sort((a, b) => {
      const priceA = a.pricing?.sellingPriceEgp || a.manual_egp_price || a.calculated_price_egp || a.base_price || 0;
      const priceB = b.pricing?.sellingPriceEgp || b.manual_egp_price || b.calculated_price_egp || b.base_price || 0;

      if (sortBy === 'PRICE_ASC') return priceA - priceB;
      if (sortBy === 'PRICE_DESC') return priceB - priceA;
      if (sortBy === 'NAME') {
        const nameA = a.name_ar || a.name || '';
        const nameB = b.name_ar || b.name || '';
        return nameA.localeCompare(nameB, 'ar');
      }
      return 0;
    });

  return (
    <div className="hts-products-page">
      <SEOHead
        title="كتالوج المنتجات والأجهزة الإلكترونية"
        description="تسوق أحدث الشاشات، كاميرات المراقبة، أجهزة DVR وNVR، ومعدات الشبكات في مصر من متجر هايبر تكنولوجي (Hyper Technology Store) بإشراف باش مهندس أحمد السيد."
        keywords="hyber technology products, hyper technology store, اسعار الشاشات, كاميرات مراقبة هيكفيجن, كاميرات داهوا, راوترات سيسكو, باش مهندس احمد"
      />
      <div className="hts-container">
        {/* Page Header */}
        <div className="products-page-header">
          <div className="header-titles">
            <div className="breadcrumb-nav">
              <button type="button" onClick={() => onNavigate('/')}>الرئيسية</button>
              <span>/</span>
              <strong>كتالوج المنتجات</strong>
            </div>
            <h1>معرض الإلكترونيات والأنظمة الكهربائية</h1>
            <p>تصفح أحدث الشاشات، كاميرات المراقبة، أجهزة DVR/NVR، والشبكات بأسعار معتمدة وضمان رسمي.</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="products-filter-bar">
          <div className="filter-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="ابحث عن منتج، موديل، ماركة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="clear-btn">
                مسح
              </button>
            )}
          </div>

          <div className="filter-selects-group">
            {/* Category Select */}
            <div className="custom-select-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="اختر القسم"
              >
                <option value="ALL">جميع الأقسام</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar || c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>

            {/* Brand Select */}
            <div className="custom-select-wrap">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                aria-label="اختر الماركة"
              >
                <option value="ALL">جميع الماركات</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>

            {/* Sort Select */}
            <div className="custom-select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="الترتيب حسب"
              >
                <option value="DEFAULT">الترتيب الافتراضي</option>
                <option value="PRICE_ASC">السعر: من الأقل للأعلى</option>
                <option value="PRICE_DESC">السعر: من الأعلى للأقل</option>
                <option value="NAME">الاسم أبجدياً</option>
              </select>
              <SlidersHorizontal size={16} />
            </div>
          </div>
        </div>

        {/* Products Results */}
        {isLoading ? (
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-catalog-box">
            <AlertCircle size={48} className="gold-text" />
            <h3>لا توجد أجهزة مطابقة لخيارات الفلترة</h3>
            <p>جرّب اختيار قسم أو ماركة أخرى أو مسح كلمة البحث.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedBrand('ALL');
                setSearchQuery('');
                setSortBy('DEFAULT');
              }}
            >
              إعادة ضبط الفلاتر
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
                  <div className="card-top-badges">
                    {product.brand_name && (
                      <span className="badge-brand">{product.brand_name}</span>
                    )}
                    {product.pricing_mode === 'USD_LINKED' && (
                      <span className="badge-usd-linked">سعر مرتبط بالدولار</span>
                    )}
                  </div>

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

                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                      <div className="card-specs-snippet">
                        {Object.entries(product.specifications).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="spec-tag">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

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
