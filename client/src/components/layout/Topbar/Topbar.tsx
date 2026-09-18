import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { BRANDING } from '../../../config/branding';
import logoImg from '../../../assets/images/logo/logo.png'; // HTS Official Logo
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  ChevronDown,
  LogOut,
  Package,
  ShieldCheck,
  X,
  Menu,
  Phone,
  Tv,
  Camera,
  Layers,
  Home,
} from 'lucide-react';
import './Topbar.css';

interface TopbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();

  const [searchInput, setSearchInput] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setIsMobileSearchOpen(false);
      setIsMobileMenuOpen(false);
      onNavigate(`/products?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    onNavigate('/');
  };

  const navigateAndClose = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  const isAdmin = isAuthenticated && user?.roles?.some((r) => ['ADMIN', 'STAFF'].includes(r));

  return (
    <header className="hts-header">
      {/* 1. Top Super Bar */}
      <div className="hts-super-bar">
        <div className="hts-container super-bar-inner">
          <div className="super-bar-start">
            <span className="supervisor-tag">
              <ShieldCheck size={14} className="gold-text" />
              <span>{BRANDING.supervisorAr}</span>
            </span>
            <span className="separator-dot">•</span>
            <span className="location-quick-text">
              <MapPin size={13} />
              <span>المعرض الرئيسي بالسويس • شحن وتوصيل لكافة محافظات مصر</span>
            </span>
          </div>

          <div className="super-bar-end">
            <a
              href="https://wa.me/201017719898"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-phone-link"
              title="تواصل على الواتساب مع باش مهندس أحمد"
            >
              <Phone size={13} />
              <span>{BRANDING.supportPhone} (واتساب)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="hts-main-nav">
        <div className="hts-container main-nav-inner">
          {/* Brand Logo & Name */}
          <div className="hts-brand-block" onClick={() => onNavigate('/')}>
            <div className="hts-logo-wrap">
              <img src={logoImg} alt={BRANDING.nameAr} className="hts-logo-img" />
            </div>
            <div className="hts-brand-text">
              <h1 className="hts-brand-title">{BRANDING.nameAr}</h1>
              <span className="hts-brand-subtitle">{BRANDING.nameEn}</span>
            </div>
          </div>

          {/* Search Form (Desktop) */}
          <form className="hts-search-form" onSubmit={handleSearchSubmit}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="hts-search-input"
              placeholder="ابحث عن شاشات، كاميرات مراقبة، أجهزة DVR، راوترات..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchInput('')}
                title="مسح البحث"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Primary Navigation Links (Desktop) */}
          <nav className="hts-desktop-nav-links">
            <button
              type="button"
              className={`hts-nav-link ${currentPath === '/' ? 'active' : ''}`}
              onClick={() => onNavigate('/')}
            >
              <Home size={16} />
              <span>الرئيسية</span>
            </button>

            <button
              type="button"
              className={`hts-nav-link ${currentPath.startsWith('/products') ? 'active' : ''}`}
              onClick={() => onNavigate('/products')}
            >
              <Layers size={16} />
              <span>المنتجات</span>
            </button>

            <button
              type="button"
              className="hts-nav-link"
              onClick={() => {
                onNavigate('/');
                setTimeout(() => {
                  const el = document.getElementById('store-location-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              <MapPin size={16} />
              <span>الموقع والتواصل</span>
            </button>
          </nav>

          {/* Actions: Search (Mobile), Cart, User Account */}
          <div className="hts-actions-group">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              className="hts-action-btn mobile-search-btn"
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              aria-label="بحث"
            >
              <Search size={20} />
            </button>

            {/* Cart Button */}
            <button
              type="button"
              className="hts-cart-btn"
              onClick={openDrawer}
              aria-label="سلة المشتريات"
            >
              <ShoppingCart size={19} />
              <span className="cart-text">السلة</span>
              {itemCount > 0 && <span className="hts-cart-badge">{itemCount}</span>}
            </button>

            {/* User Account / Auth Dropdown */}
            {isAuthenticated ? (
              <div className="hts-user-dropdown-wrap" ref={userMenuRef}>
                <button
                  type="button"
                  className="hts-user-btn"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                >
                  <div className="hts-user-avatar">
                    <User size={16} />
                  </div>
                  <span className="hts-user-name">
                    {user?.fullName ? user.fullName.split(' ')[0] : 'حسابي'}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {isUserMenuOpen && (
                  <div className="hts-dropdown-panel">
                    <div className="dropdown-user-info-box">
                      <strong>{user?.fullName || 'المستخدم'}</strong>
                      <span>{user?.phone || user?.email}</span>
                      {isAdmin && <span className="admin-badge-pill">إدارة المتجر</span>}
                    </div>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="hts-dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('/orders');
                      }}
                    >
                      <Package size={16} />
                      <span>طلباتي السابقة</span>
                    </button>

                    <button
                      type="button"
                      className="hts-dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('/profile');
                      }}
                    >
                      <User size={16} />
                      <span>الملف الشخصي والعناوين</span>
                    </button>

                    {isAdmin && (
                      <>
                        <div className="dropdown-divider" />
                        <button
                          type="button"
                          className="hts-dropdown-item admin-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('/admin');
                          }}
                        >
                          <ShieldCheck size={16} />
                          <span>لوحة الإدارة والتحكم</span>
                        </button>
                      </>
                    )}

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="hts-dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hts-auth-buttons">
                <button
                  type="button"
                  className="btn-login-quick"
                  onClick={() => onNavigate('/login')}
                >
                  تسجيل الدخول
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="hts-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="القائمة"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Input Dropdown */}
      {isMobileSearchOpen && (
        <div className="hts-mobile-search-bar">
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <Search size={18} />
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="ابحث عن شاشات، كاميرات، أجهزة مراقبة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="button"
              className="close-mobile-search"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="hts-mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="hts-mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-brand">
                <img src={logoImg} alt={BRANDING.nameAr} className="drawer-logo" />
                <span className="drawer-store-name">{BRANDING.nameAr}</span>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-supervisor-banner">
              <ShieldCheck size={16} className="gold-text" />
              <span>{BRANDING.supervisorAr}</span>
            </div>

            <div className="drawer-links-body">
              <button
                type="button"
                className={`drawer-link ${currentPath === '/' ? 'active' : ''}`}
                onClick={() => navigateAndClose('/')}
              >
                <Home size={18} />
                <span>الرئيسية</span>
              </button>

              <button
                type="button"
                className={`drawer-link ${currentPath.startsWith('/products') ? 'active' : ''}`}
                onClick={() => navigateAndClose('/products')}
              >
                <Layers size={18} />
                <span>جميع المنتجات والكتالوج</span>
              </button>

              <button
                type="button"
                className="drawer-link"
                onClick={() => {
                  navigateAndClose('/');
                  setTimeout(() => {
                    const el = document.getElementById('store-location-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
              >
                <MapPin size={18} />
                <span>المعرض الرئيسي والتواصل بالسويس</span>
              </button>

              {isAuthenticated ? (
                <>
                  <div className="drawer-section-title">حسابي</div>
                  <button
                    type="button"
                    className="drawer-link"
                    onClick={() => navigateAndClose('/orders')}
                  >
                    <Package size={18} />
                    <span>طلباتي السابقة</span>
                  </button>

                  <button
                    type="button"
                    className="drawer-link"
                    onClick={() => navigateAndClose('/profile')}
                  >
                    <User size={18} />
                    <span>الملف الشخصي والعناوين</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className="drawer-link admin-drawer-link"
                      onClick={() => navigateAndClose('/admin')}
                    >
                      <ShieldCheck size={18} />
                      <span>لوحة تحكم الإدارة</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="drawer-link logout-drawer-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>تسجيل الخروج</span>
                  </button>
                </>
              ) : (
                <div className="drawer-auth-box">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => navigateAndClose('/login')}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={() => navigateAndClose('/register')}
                  >
                    إنشاء حساب جديد
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
