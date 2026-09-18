import React, { useState, useEffect } from 'react';
import { useAnimation } from '../context/AnimationContext';
import { Presentation } from '../components/presentation/Presentation';
import { Topbar } from '../components/layout/Topbar/Topbar';
import { Footer } from '../components/layout/Footer/Footer';
import { MobileNav } from '../components/layout/MobileNav/MobileNav';
import { CartDrawer } from '../components/cart/CartDrawer';
import { AddressModal } from '../components/location/AddressModal';

// Hyper Technology Store Pages
import { HomePage } from '../pages/Home/HomePage';
import { ProductsPage } from '../pages/Products/ProductsPage';
import { SearchPage } from '../pages/Search/SearchPage';
import { CheckoutPage } from '../pages/Checkout/CheckoutPage';
import { OrderHistoryPage } from '../pages/Orders/OrderHistoryPage';
import { OrderTrackingPage } from '../pages/Orders/OrderTrackingPage';
import { CustomerProfilePage } from '../pages/Profile/CustomerProfilePage';
import { AdminDashboardPage } from '../pages/Admin/AdminDashboardPage';
import { NotificationsPage } from '../pages/Notifications/NotificationsPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';

export const App: React.FC = () => {
  const { hasSeenPresentation, markPresentationSeen } = useAnimation();
  const [currentPath, setCurrentPath] = useState<string>('/');

  // Synchronize hash routing
  useEffect(() => {
    const handleHashChange = () => {
      let rawHash = window.location.hash.replace(/^#+/, '') || '/';
      if (!rawHash.startsWith('/')) {
        rawHash = '/' + rawHash;
      }
      setCurrentPath(rawHash);
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    window.location.hash = cleanPath;
    setCurrentPath(cleanPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Initial Presentation Splash
  if (!hasSeenPresentation) {
    return <Presentation onFinish={markPresentationSeen} />;
  }

  // 2. Main Application Routing
  const renderCurrentPage = () => {
    const pathWithoutQuery = currentPath.split('?')[0];

    // Home
    if (pathWithoutQuery === '/' || pathWithoutQuery === '') {
      return <HomePage onNavigate={navigateTo} />;
    }

    // Products Catalog
    if (pathWithoutQuery === '/products') {
      return <ProductsPage onNavigate={navigateTo} />;
    }

    // Search Page
    if (pathWithoutQuery === '/search') {
      return <SearchPage onNavigate={navigateTo} />;
    }

    // Checkout Page
    if (pathWithoutQuery === '/checkout') {
      return <CheckoutPage onNavigate={navigateTo} />;
    }

    // Customer Order History
    if (pathWithoutQuery === '/orders') {
      return <OrderHistoryPage onNavigate={navigateTo} />;
    }

    // Order Tracking Page (/orders/:id, /track/:id, /track-order/:id)
    if (
      (pathWithoutQuery.startsWith('/orders/') && pathWithoutQuery !== '/orders') ||
      (pathWithoutQuery.startsWith('/track/') && pathWithoutQuery !== '/track') ||
      (pathWithoutQuery.startsWith('/track-order/') && pathWithoutQuery !== '/track-order')
    ) {
      const parts = pathWithoutQuery.split('/');
      const orderId = parts[2];
      return <OrderTrackingPage orderId={orderId} onNavigate={navigateTo} />;
    }

    // Customer Profile & Saved Addresses
    if (pathWithoutQuery === '/profile') {
      return <CustomerProfilePage onNavigate={navigateTo} />;
    }

    // Admin Operations Dashboard
    if (pathWithoutQuery === '/admin' || pathWithoutQuery === '/admin-dashboard') {
      return <AdminDashboardPage onNavigate={navigateTo} />;
    }

    // Notifications Center
    if (pathWithoutQuery === '/notifications') {
      return <NotificationsPage onNavigate={navigateTo} />;
    }

    // Authentication
    if (pathWithoutQuery === '/login') {
      return <LoginPage onNavigate={navigateTo} />;
    }
    if (pathWithoutQuery === '/register') {
      return <RegisterPage onNavigate={navigateTo} />;
    }

    // Fallback: Home
    return <HomePage onNavigate={navigateTo} />;
  };

  return (
    <div className="app-container">
      <Topbar currentPath={currentPath} onNavigate={navigateTo} />
      
      <main className="main-content">
        {renderCurrentPage()}
      </main>

      <Footer onNavigate={navigateTo} />
      <MobileNav currentPath={currentPath} onNavigate={navigateTo} />

      {/* Global Modals & Drawers */}
      <CartDrawer onNavigate={navigateTo} />
      <AddressModal />
    </div>
  );
};
