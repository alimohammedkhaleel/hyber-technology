import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  Box,
  Layers,
  Info,
} from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../common/ProductImage';
import { SEOHead } from '../common/SEO/SEOHead';
import './ProductModal.css';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onNavigate }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number>(0);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image_url
    ? [product.image_url]
    : [];

  const sellingPrice = product.pricing?.sellingPriceEgp || product.manual_egp_price || 0;
  const oldPrice = product.pricing?.oldPriceEgp || product.old_price;
  const discountPercent = product.pricing?.discountPercent || product.discount_percent || 0;
  const isAvailable = product.is_available && product.stock_quantity > 0;

  const handleAddToCart = async () => {
    if (!isAvailable) return;
    await addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleBuyNow = async () => {
    if (!isAvailable) return;
    await addToCart(product, quantity);
    onClose();
    onNavigate('/checkout');
  };

  const specsEntries = product.specifications && typeof product.specifications === 'object'
    ? Object.entries(product.specifications)
    : [];

  return (
    <AnimatePresence>
      <div className="product-modal-backdrop" onClick={onClose}>
        <motion.div
          className="product-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <SEOHead
            title={product.name_ar}
            description={product.description_ar || `${product.name_ar} - متوفر الآن لدى متجر هايبر تكنولوجي`}
            image={product.image_url || product.main_image_url}
            productData={{
              name: product.name_ar,
              description: product.description_ar,
              price: sellingPrice,
              image: product.image_url || product.main_image_url,
              sku: product.sku,
              isAvailable: isAvailable,
              brandName: product.brand_name,
            }}
          />
          {/* Close Button */}
          <button type="button" className="product-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>

          <div className="product-modal-grid">
            {/* Gallery Column */}
            <div className="product-gallery-col">
              <div className="product-main-img-box">
                <ProductImage
                  src={images[selectedImgIndex] || images[0] || product.image_url}
                  alt={product.name_ar}
                  categorySlug={product.category_slug}
                  categoryName={product.category_name_ar}
                  className="product-main-img"
                  aspectRatio="square"
                  loading="eager"
                />

                {discountPercent > 0 && (
                  <span className="product-badge-discount">
                    خصم {discountPercent}%
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="product-thumbnails-row">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`product-thumb-btn ${idx === selectedImgIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImgIndex(idx)}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Warranty Banner */}
              <div className="product-warranty-banner">
                <ShieldCheck size={22} className="gold-text" />
                <div>
                  <h4>ضمان معتمد وجودة مضمونة</h4>
                  <p>{product.warranty_info || 'ضمان شامل معتمد من الوكيل الرسمي وباش مهندس أحمد السيد'}</p>
                </div>
              </div>
            </div>

            {/* Information Column */}
            <div className="product-info-col">
              <div className="product-meta-tags">
                {product.category_name_ar && (
                  <span className="product-meta-tag category-tag">
                    <Layers size={13} />
                    <span>{product.category_name_ar}</span>
                  </span>
                )}
                {product.brand_name && (
                  <span className="product-meta-tag brand-tag">
                    <Tag size={13} />
                    <span>{product.brand_name}</span>
                  </span>
                )}
                <span className="product-sku-tag">
                  SKU: {product.sku}
                </span>
              </div>

              <h2 className="product-details-title">{product.name_ar}</h2>
              {product.name_en && (
                <p className="product-details-en-title">{product.name_en}</p>
              )}

              {/* Pricing Row */}
              <div className="product-details-price-row">
                <div className="price-box">
                  <span className="price-num">{sellingPrice.toLocaleString()}</span>
                  <span className="price-currency">ج.م</span>
                </div>

                {oldPrice && oldPrice > sellingPrice && (
                  <div className="old-price-box">
                    <span className="old-price-num">{oldPrice.toLocaleString()} ج.م</span>
                  </div>
                )}

                {/* Stock Status Indicator */}
                <div className="stock-status-pill">
                  {isAvailable ? (
                    <span className="in-stock-pill">
                      <CheckCircle2 size={14} />
                      <span>متوفر في المخزن ({product.stock_quantity} قطعة)</span>
                    </span>
                  ) : (
                    <span className="out-of-stock-pill">
                      <AlertCircle size={14} />
                      <span>غير متوفر حالياً</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description_ar && (
                <div className="product-description-block">
                  <h3 className="section-small-title">وصف المنتج:</h3>
                  <p>{product.description_ar}</p>
                </div>
              )}

              {/* Specifications Table */}
              {specsEntries.length > 0 && (
                <div className="product-specs-block">
                  <h3 className="section-small-title">المواصفات الفنية:</h3>
                  <div className="specs-table-wrapper">
                    <table className="specs-table">
                      <tbody>
                        {specsEntries.map(([key, val], idx) => (
                          <tr key={idx}>
                            <td className="spec-key">{key}</td>
                            <td className="spec-val">{String(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quantity & Actions Row */}
              {isAvailable && (
                <div className="product-actions-area">
                  <div className="quantity-controller">
                    <span className="qty-label">الكمية:</span>
                    <div className="qty-buttons-group">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="qty-display">{quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                        disabled={quantity >= product.stock_quantity}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="buttons-action-row">
                    <button
                      type="button"
                      className="btn-modal-add-cart"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={18} />
                      <span>إضافة إلى السلة</span>
                    </button>

                    <button
                      type="button"
                      className="btn-modal-buy-now"
                      onClick={handleBuyNow}
                    >
                      <Zap size={18} />
                      <span>شراء الآن</span>
                    </button>
                  </div>

                  {addedNotice && (
                    <motion.div
                      className="added-to-cart-alert"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <CheckCircle2 size={16} />
                      <span>تمت إضافة المنتج إلى سلة مشترياتك بنجاح.</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
