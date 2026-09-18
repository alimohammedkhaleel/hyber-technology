import React from 'react';
import { Home, Layers, ShoppingBag, Package, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import './MobileNav.css';

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, onNavigate, onOpenCart }) => {
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  return (
    <nav className="mobile-nav-bar" aria-label="التنقل الرئيسي للجوال">
      <button
        type="button"
        className={`mobile-nav-tab ${currentPath === '/' ? 'active' : ''}`}
        onClick={() => onNavigate('/')}
      >
        <Home size={20} />
        <span>الرئيسية</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-tab ${currentPath.startsWith('/products') ? 'active' : ''}`}
        onClick={() => onNavigate('/products')}
      >
        <Layers size={20} />
        <span>المنتجات</span>
      </button>

      <button
        type="button"
        className="mobile-nav-tab cart-tab"
        onClick={() => {
          if (onOpenCart) {
            onOpenCart();
          } else {
            onNavigate('/cart');
          }
        }}
      >
        <div className="mobile-nav-icon-wrap">
          <ShoppingBag size={20} />
          {itemCount > 0 && (
            <span className="mobile-nav-badge">{itemCount > 99 ? '99+' : itemCount}</span>
          )}
        </div>
        <span>السلة</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-tab ${currentPath.startsWith('/orders') ? 'active' : ''}`}
        onClick={() => {
          if (isAuthenticated) {
            onNavigate('/orders');
          } else {
            onNavigate('/login');
          }
        }}
      >
        <div className="mobile-nav-icon-wrap">
          <Package size={20} />
        </div>
        <span>طلباتي</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-tab ${currentPath.startsWith('/profile') ? 'active' : ''}`}
        onClick={() => {
          if (isAuthenticated) {
            onNavigate('/profile');
          } else {
            onNavigate('/login');
          }
        }}
      >
        <User size={20} />
        <span>حسابي</span>
      </button>
    </nav>
  );
};
