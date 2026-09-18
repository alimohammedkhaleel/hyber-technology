import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api/productService';
import { Product, Category } from '../../types';
import { ProductModal } from '../../components/product/ProductModal';
import { ProductImage } from '../../components/common/ProductImage';
import { useCart } from '../../context/CartContext';
import {
  Search,
  Box,
  Layers,
  ShoppingCart,
  X,
  SlidersHorizontal,
  Tag,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { SkeletonCard, Spinner } from '../../components/feedback';
import { BRANDING } from '../../config/branding';
import './SearchPage.css';

interface SearchPageProps {
  onNavigate: (path: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onNavigate }) => {
  const { addToCart } = useCart();
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sync with URL hash query
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('search=') || hash.includes('q=')) {
      const qParam = decodeURIComponent(
        (hash.split('search=')[1] || hash.split('q=')[1] || '').split('&')[0]
      );
      setQuery(qParam);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await productService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories in search:', err);
      }
    };
    fetchCats();
  }, []);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim() && selectedCategory === 'ALL') {
        setProducts([]);
        return;
      }

      try {
        setIsLoading(true);
        const params: any = {};
        if (query.trim()) params.search = query.trim();
        if (selectedCategory !== 'ALL') params.categoryId = selectedCategory;

        const results = await productService.getProducts(params);
        setProducts(results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  return (
    <div className="search-page-container">
      <SEOHead
        title={query ? `نتائج البحث عن: ${query}` : 'البحث في كتالوج هايبر تكنولوجي'}
        description={`ابحث في متجر هايبر تكنولوجي عن أحدث الشاشات، كاميرات المراقبة، أجهزة DVR، والشبكات. ${BRANDING.supervisorAr}.`}
        keywords={`بحث هايبر تكنولوجي, hyber technology search, ${query}`}
      />
      {/* Search Header Bar */}
      <section className="search-header-bar">
        <div className="hts-container search-header-inner">
          <div className="search-title-box">
            <h1 className="search-main-heading">البحث في الكتالوج الإلكتروني والتقني</h1>
            <p className="search-subheading">
              ابحث عن الشاشات الذكية، كاميرات المراقبة، أجهزة التسجيل، والأنظمة الكهربائية
            </p>
          </div>

          <div className="search-input-wrapper">
            <Search size={22} className="search-input-icon" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الموديل، الماركة (سامسونج، داهوا، هايكفيجن...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-text-input"
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="search-clear-action"
                onClick={() => setQuery('')}
                title="مسح البحث"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Pills Filter */}
          <div className="search-category-pills">
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              <Layers size={14} />
              <span>كافة الأقسام</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.name_ar}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Content */}
      <main className="hts-container search-results-container">
        {isLoading ? (
          <div className="search-products-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : !query.trim() && selectedCategory === 'ALL' ? (
          <div className="search-state-box prompt-box">
            <div className="search-icon-circle">
              <Search size={40} />
            </div>
            <h3>ابدأ البحث في متجر هايبر تكنولوجي</h3>
            <p>اكتب اسم الجهاز، الموديل، أو اختر قسماً من الأقسام أعلاه لاستعراض الأجهزة المتاحة بأسعارها المعتمدة.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="search-state-box empty-box">
            <div className="search-icon-circle">
              <Box size={40} />
            </div>
            <h3>لم يتم العثور على أجهزة مطابقة</h3>
            <p>
              لم نجد أي منتجات تطابق "{query}". يرجى التأكد من كتابة الكلمات بشكل صحيح أو تصفح الكتالوج الكامل.
            </p>
            <button
              type="button"
              className="btn-browse-all"
              onClick={() => onNavigate('/products')}
            >
              <span>تصفح كافة المنتجات</span>
            </button>
          </div>
        ) : (
          <div className="search-results-section">
            <div className="search-results-meta">
              <h2 className="results-count-title">
                نتائج البحث ({products.length} منتج تقني)
              </h2>
              {query && <span className="query-badge">الكلمة: "{query}"</span>}
            </div>

            <div className="search-products-grid">
              {products.map((product) => {
                const sellingPrice = product.pricing?.sellingPriceEgp || product.manual_egp_price || 0;
                const oldPrice = product.pricing?.oldPriceEgp || product.old_price;
                const discount = product.pricing?.discountPercent || product.discount_percent || 0;
                const isAvailable = product.is_available && product.stock_quantity > 0;

                return (
                  <div
                    key={product.id}
                    className="search-product-card"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="search-card-img-wrap">
                      <ProductImage
                        src={product.image_url || product.main_image_url}
                        alt={product.name_ar}
                        categorySlug={product.category_slug}
                        categoryName={product.category_name_ar}
                        className="search-card-img"
                        loading="lazy"
                      />

                      {discount > 0 && (
                        <span className="search-discount-badge">خصم {discount}%</span>
                      )}

                      {product.category_name_ar && (
                        <span className="search-category-badge">{product.category_name_ar}</span>
                      )}
                    </div>

                    <div className="search-card-body">
                      {product.brand_name && (
                        <span className="search-card-brand">
                          <Tag size={12} />
                          <span>{product.brand_name}</span>
                        </span>
                      )}

                      <h3 className="search-card-title">{product.name_ar}</h3>
                      {product.name_en && (
                        <span className="search-card-subtitle">{product.name_en}</span>
                      )}

                      {product.description_ar && (
                        <p className="search-card-desc">{product.description_ar}</p>
                      )}

                      <div className="search-card-footer">
                        <div className="search-price-block">
                          <div className="price-primary">
                            <strong>{sellingPrice.toLocaleString()}</strong>
                            <span className="currency-unit">ج.م</span>
                          </div>
                          {oldPrice && oldPrice > sellingPrice && (
                            <span className="price-old">{oldPrice.toLocaleString()} ج.م</span>
                          )}
                        </div>

                        <div className="search-card-actions">
                          {isAvailable ? (
                            <button
                              type="button"
                              className="search-add-cart-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                              }}
                              title="إضافة إلى السلة"
                            >
                              <ShoppingCart size={16} />
                              <span>أضف</span>
                            </button>
                          ) : (
                            <span className="search-out-stock-label">غير متوفر</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
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
