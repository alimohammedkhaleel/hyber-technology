import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/api/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { BRANDING } from '../../config/branding';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  AlertCircle,
  Send,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { PageLoader, ButtonLoader } from '../../components/feedback';
import './OrderTrackingPage.css';

interface OrderTrackingPageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment proof form state
  const [paymentRefInput, setPaymentRefInput] = useState<string>('');
  const [payerPhoneInput, setPayerPhoneInput] = useState<string>('');
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);
  const [proofSuccessMsg, setProofSuccessMsg] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
      if (data?.payment_reference) {
        setPaymentRefInput(data.payment_reference);
      }
      if (data?.payer_phone) {
        setPayerPhoneInput(data.payer_phone);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل تفاصيل الطلب.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRefInput.trim()) return;

    try {
      setIsSubmittingProof(true);
      setProofSuccessMsg(null);
      const updated = await orderService.submitPaymentProof(orderId, {
        paymentReference: paymentRefInput.trim(),
        payerPhone: payerPhoneInput.trim() || undefined,
      });
      setOrder(updated);
      setProofSuccessMsg('تم إرسال الرقم المرجعي للدفع بنجاح. سيقوم فريق العمل بمراجعته وتأكيد الطلب.');
    } catch (err: any) {
      alert(err.message || 'فشل في حفظ الرقم المرجعي.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="hts-order-tracking-page">
        <SEOHead title="تتبع الطلب" />
        <div className="hts-container" style={{ padding: '60px 20px' }}>
          <PageLoader message="جاري جلب تفاصيل ومراحل الطلب..." />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="hts-order-tracking-page">
        <div className="hts-container">
          <div className="tracking-error-card">
            <AlertCircle size={48} className="gold-text" />
            <h2>لم يتم العثور على الطلب</h2>
            <p>{error || 'الطلب المطلوب غير موجود أو تم حذفه.'}</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('/orders')}>
              <span>العودة لسجل الطلبات</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'تسجيل الطلب', desc: 'تم استلام طلبك بالنظام' },
    { key: 'PAYMENT_VERIFICATION', label: 'مراجعة الدفع', desc: 'التحقق من التحويل أو إعداد الدفع' },
    { key: 'CONFIRMED', label: 'تأكيد الطلب', desc: 'تم الاعتماد تحت إشراف هندسي' },
    { key: 'PROCESSING', label: 'الفحص والتجهيز', desc: 'فحص واختبار الأجهزة والتغليف' },
    { key: 'OUT_FOR_DELIVERY', label: 'جاري التوصيل', desc: 'الطلب في الطريق إلى عنوانك' },
    { key: 'DELIVERED', label: 'تم الاستلام', desc: 'تم تسليم الأجهزة بنجاح' },
  ];

  const getStepStatus = (stepKey: string) => {
    const statusOrder = [
      'PENDING',
      'PAYMENT_VERIFICATION',
      'CONFIRMED',
      'PROCESSING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];
    const currentIndex = statusOrder.indexOf(order.order_status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (order.order_status === 'CANCELLED' || order.order_status === 'REJECTED') {
      return 'cancelled';
    }
    if (stepIndex <= currentIndex) {
      return 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className="hts-order-tracking-page">
      <SEOHead
        title={`تتبع الطلب #${order.order_number}`}
        description={`تتبع مراحل وتفاصيل طلب الأجهزة رقم #${order.order_number} في متجر هايبر تكنولوجي.`}
      />
      <div className="hts-container">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <button type="button" onClick={() => onNavigate('/')}>الرئيسية</button>
          <span>/</span>
          <button type="button" onClick={() => onNavigate('/orders')}>طلباتي</button>
          <span>/</span>
          <strong>تتبع الطلب #{order.order_number}</strong>
        </div>

        {/* Order Header Box */}
        <div className="tracking-header-card">
          <div className="header-meta">
            <div className="meta-num">
              <Package size={22} className="gold-text" />
              <h1>طلب رقم: {order.order_number}</h1>
            </div>
            <span className="order-date-text">
              تاريخ التسجيل: {new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}
            </span>
          </div>

          <div className="header-status-badge">
            <span className={`status-pill status-${order.order_status.toLowerCase()}`}>
              {order.order_status === 'PENDING' && 'قيد المراجعة'}
              {order.order_status === 'PAYMENT_VERIFICATION' && 'مراجعة التحويل البنكي'}
              {order.order_status === 'CONFIRMED' && 'تم التأكيد والاعتماد'}
              {order.order_status === 'PROCESSING' && 'جاري الفحص والتجهيز'}
              {order.order_status === 'READY' && 'جاهز للتسليم'}
              {order.order_status === 'OUT_FOR_DELIVERY' && 'جاري التوصيل'}
              {order.order_status === 'DELIVERED' && 'تم الاستلام بنجاح'}
              {order.order_status === 'CANCELLED' && 'تم الإلغاء'}
              {order.order_status === 'REJECTED' && 'مرفوض'}
            </span>
          </div>
        </div>

        {/* Order Progress Timeline */}
        <div className="tracking-timeline-card">
          <h3>مراحل تنفيذ الطلب</h3>
          <div className="timeline-steps-track">
            {steps.map((step, idx) => {
              const state = getStepStatus(step.key);
              return (
                <div key={step.key} className={`timeline-step-item ${state}`}>
                  <div className="step-marker">
                    {state === 'completed' ? <CheckCircle2 size={20} /> : <span>{idx + 1}</span>}
                  </div>
                  <div className="step-content">
                    <strong>{step.label}</strong>
                    <span>{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tracking-details-grid">
          {/* Column 1: Payment & Delivery Details */}
          <div className="details-col">
            {/* Payment Proof Card for Electronic Payments */}
            {(order.payment_method === 'INSTAPAY' || order.payment_method === 'VODAFONE_CASH') && (
              <div className="tracking-card payment-proof-card">
                <div className="card-top-title">
                  <ShieldCheck size={20} className="gold-text" />
                  <h4>بيانات الدفع الإلكتروني</h4>
                </div>

                <div className="payment-status-row">
                  <span>حالة الدفع: </span>
                  <strong className={`payment-pill pill-${order.payment_status.toLowerCase()}`}>
                    {order.payment_status === 'PAID' ? 'تم اعتماد الدفع بنجاح' : 'بانتظار التحقق من التحويل'}
                  </strong>
                </div>

                {order.payment_status !== 'PAID' && (
                  <form onSubmit={handleSubmitProof} className="proof-submit-form">
                    <p className="proof-guide">
                      {order.payment_method === 'INSTAPAY'
                        ? 'يرجى تسجيل الرقم المرجعي للتحويل الظاهر في إشعار إنستاباي لتأكيد استلام المبلغ.'
                        : 'يرجى تسجيل رقم المعاملة ورقم المحفظة التي قمت بالتحويل منها.'}
                    </p>

                    {proofSuccessMsg && (
                      <div className="proof-success-alert">
                        <CheckCircle2 size={16} />
                        <span>{proofSuccessMsg}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="proof-ref">الرقم المرجعي / كود التحويل *</label>
                      <input
                        id="proof-ref"
                        type="text"
                        required
                        placeholder="أدخل الرقم المرجعي للتحويل"
                        value={paymentRefInput}
                        onChange={(e) => setPaymentRefInput(e.target.value)}
                      />
                    </div>

                    {order.payment_method === 'VODAFONE_CASH' && (
                      <div className="form-group">
                        <label htmlFor="payer-phone">رقم المحفظة المحول منها</label>
                        <input
                          id="payer-phone"
                          type="tel"
                          dir="ltr"
                          placeholder="010XXXXXXXX"
                          value={payerPhoneInput}
                          onChange={(e) => setPayerPhoneInput(e.target.value)}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isSubmittingProof}
                    >
                      <Send size={14} />
                      <span>{isSubmittingProof ? 'جاري الإرسال...' : 'حفظ الرقم المرجعي'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Delivery Address Card */}
            <div className="tracking-card">
              <div className="card-top-title">
                <MapPin size={20} className="gold-text" />
                <h4>عنوان التوصيل بالسويس</h4>
              </div>
              <p className="delivery-address-text">{order.delivery_address}</p>
              <div className="customer-contact-meta">
                <div>
                  <span>المستلم: </span>
                  <strong>{order.customer_name}</strong>
                </div>
                <div>
                  <span>الهاتف: </span>
                  <strong dir="ltr">{order.customer_phone}</strong>
                </div>
              </div>
            </div>

            {/* Store Contact & Supervisor Info */}
            <div className="tracking-card store-info-card">
              <div className="card-top-title">
                <Phone size={20} className="gold-text" />
                <h4>الدعم الفني واستفسارات الطلب</h4>
              </div>
              <p>تحت إشراف مباشر من <strong>{BRANDING.supervisorAr}</strong></p>
              <p className="store-sub-addr">{BRANDING.address}</p>
              <a href={`tel:${BRANDING.supportPhone}`} className="btn btn-outline btn-block" dir="ltr">
                <Phone size={16} />
                <span>{BRANDING.supportPhone}</span>
              </a>
            </div>
          </div>

          {/* Column 2: Order Items & Financial Summary */}
          <div className="details-col">
            <div className="tracking-card items-summary-card">
              <div className="card-top-title">
                <FileText size={20} className="gold-text" />
                <h4>تفاصيل الأجهزة المطلوبة</h4>
              </div>

              <div className="items-list-box">
                {order.items && order.items.map((item) => (
                  <div key={item.id} className="item-detail-row">
                    <div className="item-qty-badge">{item.quantity}x</div>
                    <div className="item-main-details">
                      <strong>{item.product_name}</strong>
                      <span className="sku-tag">SKU: {item.product_sku}</span>
                      <span className="unit-calc">
                        {Number(item.unit_price).toLocaleString('en-US')} ج.م للقطعة
                      </span>
                    </div>
                    <div className="item-total-val">
                      {Number(item.total_price).toLocaleString('en-US')} ج.م
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-financial-breakdown">
                <div className="breakdown-row">
                  <span>المجموع الفرعي:</span>
                  <strong>{Number(order.subtotal).toLocaleString('en-US')} ج.م</strong>
                </div>
                <div className="breakdown-row">
                  <span>رسوم التوصيل:</span>
                  <strong className="green-text">مجاناً</strong>
                </div>
                <div className="breakdown-row total-calc-row">
                  <span>إجمالي المبلغ المطلوب:</span>
                  <strong className="grand-total">{Number(order.total).toLocaleString('en-US')} ج.م</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
