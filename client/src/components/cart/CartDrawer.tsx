import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { BRANDING } from '../../config/branding';
import { ProductImage } from '../common/ProductImage';
import './CartDrawer.css';

interface CartDrawerProps {
  onNavigate: (path: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    itemCount,
    total,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  const handleCheckout = () => {
    closeDrawer();
    onNavigate('/checkout');
  };

  const handleContinueShopping = () => {
    closeDrawer();
    onNavigate('/products');
  };

  if (!isDrawerOpen) return null;

  return (
    <AnimatePresence>
      <div className="cart-drawer-backdrop" onClick={closeDrawer}>
        <motion.div
          className="cart-drawer-panel"
          onClick={(e) => e.stopPropagation()}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="cart-drawer-header">
            <div className="cart-drawer-title-wrap">
              <ShoppingCart size={22} className="gold-text" />
              <h3>سلة المشتريات ({itemCount})</h3>
            </div>
            <button
              type="button"
              className="cart-drawer-close"
              onClick={closeDrawer}
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="cart-drawer-body">
            {items.length === 0 ? (
              <div className="cart-drawer-empty">
                <div className="cart-empty-icon-wrap">
                  <ShoppingBag size={48} className="empty-cart-icon" />
                </div>
                <h4>سلة المشتريات فارغة حالياً</h4>
                <p>تصفح أحدث الشاشات، كاميرات المراقبة، وأجهزة التكنولوجيا وأضف ما يناسبك إلى السلة.</p>
                <button
                  type="button"
                  className="btn-empty-shop"
                  onClick={handleContinueShopping}
                >
                  <span>تصفح المنتجات الآن</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map((item) => (
                  <div key={item.id} className="cart-drawer-item">
                    <div className="cart-item-img-box">
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.nameAr}
                        className="cart-item-img"
                        aspectRatio="square"
                      />
                    </div>

                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.nameAr}</h4>
                      <div className="cart-item-sku">SKU: {item.sku}</div>
                      <div className="cart-item-price-unit">
                        <strong>{item.unitPrice.toLocaleString()}</strong> {BRANDING.currency}
                      </div>

                      <div className="cart-item-controls">
                        <div className="cart-item-qty-selector">
                          <button
                            type="button"
                            className="btn-qty-mini"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="qty-num">{item.quantity}</span>
                          <button
                            type="button"
                            className="btn-qty-mini"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-drawer-subtotal-row">
                <span>الإجمالي الكلي:</span>
                <strong className="cart-total-amount">
                  {total.toLocaleString()} {BRANDING.currency}
                </strong>
              </div>

              <div className="cart-trust-note">
                <ShieldCheck size={16} className="gold-text" />
                <span>جميع الأسعار بالجنيه المصري شاملة الضمان المعتمد</span>
              </div>

              <div className="cart-footer-actions">
                <button
                  type="button"
                  className="btn-checkout-proceed"
                  onClick={handleCheckout}
                >
                  <span>متابعة إتمام الطلب</span>
                  <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
