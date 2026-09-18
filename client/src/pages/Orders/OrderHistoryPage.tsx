import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Eye, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { orderService } from '../../services/api/orderService';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { SkeletonCard } from '../../components/feedback';
import './OrderHistoryPage.css';

interface OrderHistoryPageProps {
  onNavigate?: (path: string) => void;
}

export const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل سجل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="order-status-badge badge-pending">
            <Clock size={14} />
            <span>قيد المراجعة</span>
          </span>
        );
      case 'PAYMENT_VERIFICATION':
        return (
          <span className="order-status-badge badge-verification">
            <ShieldCheck size={14} />
            <span>مراجعة التحويل البنكي</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="order-status-badge badge-confirmed">
            <CheckCircle2 size={14} />
            <span>تم التأكيد والاعتماد</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="order-status-badge badge-processing">
            <Package size={14} />
            <span>جاري التجهيز والاختبار</span>
          </span>
        );
      case 'READY':
        return (
          <span className="order-status-badge badge-ready">
            <CheckCircle2 size={14} />
            <span>جاهز للتسليم / الشحن</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="order-status-badge badge-delivery">
            <Truck size={14} />
            <span>جاري التوصيل للعنوان</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="order-status-badge badge-delivered">
            <CheckCircle2 size={14} />
            <span>تم الاستلام بنجاح</span>
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="order-status-badge badge-cancelled">
            <XCircle size={14} />
            <span>ملغي / مرفوض</span>
          </span>
        );
      default:
        return (
          <span className="order-status-badge">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string, status: PaymentStatus) => {
    const isPaid = status === 'PAID';
    return (
      <span className={`payment-mini-badge ${isPaid ? 'paid' : 'pending'}`}>
        <CreditCard size={12} />
        <span>
          {method === 'CASH_ON_DELIVERY' ? 'الدفع عند الاستلام' : method === 'INSTAPAY' ? 'إنستاباي' : 'فودافون كاش'}
          {isPaid ? ' (تم السداد)' : ' (قيد التحقق/الدفع)'}
        </span>
      </span>
    );
  };

  return (
    <div className="hts-orders-history-page">
      <SEOHead
        title="سجل طلباتي"
        description="متابعة وتتبع سجل طلباتك وفواتير مشترياتك في متجر هايبر تكنولوجي."
      />
      <div className="hts-container">
        {/* Header */}
        <div className="orders-page-header">
          <div className="header-titles">
            <div className="breadcrumb-nav">
              <button type="button" onClick={() => onNavigate?.('/')}>الرئيسية</button>
              <span>/</span>
              <strong>طلباتي</strong>
            </div>
            <h1>سجل طلبات الأجهزة والإلكترونيات</h1>
            <p>تتبع حالة طلباتك الحالية وسجل مشترياتك السابقة من متجر هايبر تكنولوجي بالسويس.</p>
          </div>
        </div>

        {loading ? (
          <div className="orders-loading-skeleton">
            {[1, 2, 3].map((n) => (
              <div key={n} className="order-card-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="orders-error-box">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchOrders}>
              إعادة المحاولة
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-orders-box">
            <ShoppingBag size={56} className="gold-text" />
            <h3>لا توجد طلبات سابقة</h3>
            <p>لم تقم بتسجيل أي طلبات بعد. تصفح أحدث الشاشات وكاميرات المراقبة الآن.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate?.('/products')}
            >
              <span>تصفح المنتجات</span>
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <div className="orders-cards-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className="hts-order-card"
                onClick={() => onNavigate?.(`/orders/${order.id}`)}
              >
                <div className="order-card-top">
                  <div className="order-num-block">
                    <Package size={18} className="gold-text" />
                    <strong>{order.order_number}</strong>
                  </div>
                  {getOrderStatusBadge(order.order_status)}
                </div>

                <div className="order-card-middle">
                  <div className="order-detail-info">
                    <span className="label">تاريخ الطلب:</span>
                    <span>{new Date(order.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="order-detail-info">
                    <span className="label">عنوان التوصيل:</span>
                    <span>{order.delivery_address}</span>
                  </div>
                  <div className="order-detail-info">
                    <span className="label">طريقة الدفع:</span>
                    {getPaymentBadge(order.payment_method, order.payment_status)}
                  </div>
                </div>

                <div className="order-card-bottom">
                  <div className="order-total-price">
                    <span>الإجمالي: </span>
                    <strong>{Number(order.total).toLocaleString('en-US')} ج.م</strong>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm order-track-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.(`/orders/${order.id}`);
                    }}
                  >
                    <Eye size={15} />
                    <span>تتبع الطلب</span>
                    <ChevronLeft size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
