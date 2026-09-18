import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api/orderService';
import { apiClient } from '../../services/api/client';
import { PaymentMethod } from '../../types';
import { BRANDING } from '../../config/branding';
import {
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShoppingBag,
  User,
  Phone,
  ArrowLeft,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { ButtonLoader } from '../../components/feedback';
import './CheckoutPage.css';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

export interface GovernorateOption {
  id: string;
  nameAr: string;
  fee: number;
}

export const EGYPT_GOVERNORATES: GovernorateOption[] = [
  { id: 'suez', nameAr: 'السويس', fee: 40 },
  { id: 'cairo', nameAr: 'القاهرة', fee: 50 },
  { id: 'giza', nameAr: 'الجيزة', fee: 50 },
  { id: 'ismailia', nameAr: 'الإسماعيلية', fee: 40 },
  { id: 'port_said', nameAr: 'بورسعيد', fee: 45 },
  { id: 'qalyubia', nameAr: 'القليوبية', fee: 55 },
  { id: 'alexandria', nameAr: 'الإسكندرية', fee: 60 },
  { id: 'sharqia', nameAr: 'الشرقية', fee: 55 },
  { id: 'dakahlia', nameAr: 'الدقهلية', fee: 55 },
  { id: 'damietta', nameAr: 'دمياط', fee: 55 },
  { id: 'monufia', nameAr: 'المنوفية', fee: 55 },
  { id: 'gharbia', nameAr: 'الغربية', fee: 55 },
  { id: 'kafr_el_sheikh', nameAr: 'كفر الشيخ', fee: 60 },
  { id: 'beheira', nameAr: 'البحيرة', fee: 60 },
  { id: 'fayoum', nameAr: 'الفيوم', fee: 65 },
  { id: 'beni_suef', nameAr: 'بني سويف', fee: 65 },
  { id: 'minya', nameAr: 'المنيا', fee: 70 },
  { id: 'asyut', nameAr: 'أسيوط', fee: 75 },
  { id: 'sohag', nameAr: 'سوهاج', fee: 80 },
  { id: 'qena', nameAr: 'قنا', fee: 85 },
  { id: 'luxor', nameAr: 'الأقصر', fee: 90 },
  { id: 'aswan', nameAr: 'أسوان', fee: 95 },
  { id: 'red_sea', nameAr: 'البحر الأحمر (الغردقة، رأس غارب...)', fee: 75 },
  { id: 'south_sinai', nameAr: 'جنوب سيناء (شرم الشيخ، طور سيناء...)', fee: 70 },
  { id: 'north_sinai', nameAr: 'شمال سيناء (العريش...)', fee: 70 },
  { id: 'matrouh', nameAr: 'مطروح والساحل الشمالي', fee: 90 },
  { id: 'new_valley', nameAr: 'الوادي الجديد', fee: 100 },
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [governoratesList, setGovernoratesList] = useState<GovernorateOption[]>(EGYPT_GOVERNORATES);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('suez');
  const [detailedAddress, setDetailedAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [payerPhone, setPayerPhone] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Load dynamic shipping rates from store settings and merge with local names
    apiClient
      .get('/settings')
      .then((res) => {
        const s = res.data?.data?.settings;
        if (s?.shipping_rates && Array.isArray(s.shipping_rates) && s.shipping_rates.length > 0) {
          // Merge API fees with local Arabic names (API may have updated fees)
          const merged = EGYPT_GOVERNORATES.map((local) => {
            const fromServer = s.shipping_rates.find((r: any) => r.id === local.id);
            return fromServer ? { ...local, fee: fromServer.fee, enabled: fromServer.enabled } : local;
          });
          setGovernoratesList(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('/login');
      return;
    }
    if (user) {
      const profile = (user as any).profile || user;
      setCustomerName(profile.full_name || (user as any).fullName || '');
      setCustomerPhone(profile.phone || (user as any).phone || '');
    }
  }, [isAuthenticated, user, onNavigate]);

  const activeGov = governoratesList.find((g) => g.id === selectedGovernorate) || governoratesList[0];
  const deliveryFee = activeGov.fee;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim() || !detailedAddress.trim()) {
      setErrorMsg('يرجى استكمال جميع بيانات العميل والعنوان بالتفصيل.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('سلة المشتريات فارغة.');
      return;
    }

    if ((paymentMethod === 'INSTAPAY' || paymentMethod === 'VODAFONE_CASH') && !paymentReference.trim()) {
      setErrorMsg('يرجى كتابة الرقم المرجعي للتحويل أو رقم المعاملة بعد إتمام التحويل.');
      return;
    }

    const fullFormattedAddress = `المحافظة: ${activeGov.nameAr} | العنوان: ${detailedAddress.trim()}`;

    try {
      setIsSubmitting(true);
      const order = await orderService.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: fullFormattedAddress,
        notes: orderNotes.trim() ? `${orderNotes.trim()} (رسوم التوصيل: ${deliveryFee} ج.م)` : `رسوم التوصيل: ${deliveryFee} ج.م`,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        payerPhone: payerPhone.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      await clearCart();
      setSuccessOrderNumber(order.order_number);
      setCreatedOrderId(order.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrderNumber && createdOrderId) {
    return (
      <div className="hts-checkout-success-page">
        <div className="hts-container">
          <div className="success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={56} />
            </div>
            <h2>تم تسجيل طلبك بنجاح!</h2>
            <p className="order-number-banner">
              رقم الطلب: <strong>{successOrderNumber}</strong>
            </p>
            <p className="success-desc">
              تحت إشراف باش مهندس أحمد السيد، سنقوم بمراجعة طلبك وتجهيز الأجهزة بدقة واختبارها قبل التوصيل.
            </p>

            {paymentMethod === 'INSTAPAY' || paymentMethod === 'VODAFONE_CASH' ? (
              <div className="payment-notice-card">
                <ShieldCheck size={20} className="gold-text" />
                <div>
                  <strong>تم تسجيل الرقم المرجعي للتحويل: {paymentReference}</strong>
                  <p>سيقوم فريق العمل بالتحقق من التحويل وتأكيد الطلب في أقرب وقت.</p>
                </div>
              </div>
            ) : (
              <div className="payment-notice-card cod-notice">
                <Banknote size={20} className="gold-text" />
                <div>
                  <strong>طريقة الدفع: نقداً عند الاستلام (COD)</strong>
                  <p>يرجى تجهيز المبلغ ({total.toLocaleString('en-US')} ج.م) عند استلام المندوب للأجهزة.</p>
                </div>
              </div>
            )}

            <div className="success-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate(`/orders/${createdOrderId}`)}
              >
                <span>تتبع حالة الطلب</span>
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onNavigate('/products')}
              >
                <span>العودة للمتجر</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="hts-empty-checkout">
        <div className="hts-container">
          <div className="empty-checkout-card">
            <ShoppingBag size={56} className="gold-text" />
            <h2>سلة المشتريات فارغة</h2>
            <p>لا توجد منتجات في السلة لإتمام الطلب.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('/products')}
            >
              <span>تصفح كتالوج المنتجات</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hts-checkout-page">
      <SEOHead
        title="إتمام وتأكيد الطلب"
        description="صفحة إتمام الطلب وتحديد عنوان الشحن وطريقة الدفع (كاش، إنستاباي، فودافون كاش) في متجر هايبر تكنولوجي."
      />
      <div className="hts-container">
        {/* Header */}
        <div className="checkout-header">
          <div className="breadcrumb-nav">
            <button type="button" onClick={() => onNavigate('/')}>الرئيسية</button>
            <span>/</span>
            <button type="button" onClick={() => onNavigate('/products')}>المنتجات</button>
            <span>/</span>
            <strong>إتمام الطلب</strong>
          </div>
          <h1>تأكيد الطلب وتفاصيل التوصيل</h1>
        </div>

        {errorMsg && (
          <div className="checkout-alert-box">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="checkout-grid-layout">
          {/* Right Column: Customer Info & Payment */}
          <div className="checkout-form-column">
            {/* 1. Customer Details */}
            <div className="checkout-card">
              <div className="card-header">
                <User size={20} className="gold-text" />
                <h3>بيانات العميل وعنوان التوصيل</h3>
              </div>

              <div className="card-form-body">
                <div className="form-group">
                  <label htmlFor="checkout-name">الاسم الكامل *</label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد علي"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-phone">رقم الهاتف للتواصل *</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="010XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-gov">المحافظة *</label>
                  <select
                    id="checkout-gov"
                    className="form-input"
                    value={selectedGovernorate}
                    onChange={(e) => setSelectedGovernorate(e.target.value)}
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.nameAr} - (شحن {gov.fee} ج.م)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-address">العنوان بالتفصيل داخل المحافظة (المدينة / الحي / الشارع / رقم العمارة والشقة) *</label>
                  <textarea
                    id="checkout-address"
                    rows={3}
                    required
                    placeholder="مثال: حي الأربعين / شارع الجيش / عمارة رقم 14 / الدور الثالث شقة 5"
                    value={detailedAddress}
                    onChange={(e) => setDetailedAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkout-notes">ملاحظات إضافية على الطلب (اختياري)</label>
                  <input
                    id="checkout-notes"
                    type="text"
                    placeholder="أي تعليمات للمندوب أو متطلبات فنية خاصة"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Methods */}
            <div className="checkout-card">
              <div className="card-header">
                <CreditCard size={20} className="gold-text" />
                <h3>اختر طريقة الدفع</h3>
              </div>

              <div className="card-form-body">
                <div className="payment-options-list">
                  {/* Option 1: COD */}
                  <label className={`payment-option-label ${paymentMethod === 'CASH_ON_DELIVERY' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_ON_DELIVERY"
                      checked={paymentMethod === 'CASH_ON_DELIVERY'}
                      onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    />
                    <div className="option-icon-box">
                      <Banknote size={20} />
                    </div>
                    <div className="option-text">
                      <strong>الدفع عند الاستلام (Cash on Delivery)</strong>
                      <span>الدفع نقداً بعد فحص الأجهزة واستلامها من المندوب.</span>
                    </div>
                  </label>

                  {/* Option 2: InstaPay */}
                  <label className={`payment-option-label ${paymentMethod === 'INSTAPAY' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="INSTAPAY"
                      checked={paymentMethod === 'INSTAPAY'}
                      onChange={() => setPaymentMethod('INSTAPAY')}
                    />
                    <div className="option-icon-box">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="option-text">
                      <strong>تحويل عبر تطبيق إنستاباي (InstaPay)</strong>
                      <span>تحويل بنكي لحظي لحساب المتجر الرسمي.</span>
                    </div>
                  </label>

                  {/* Option 3: Vodafone Cash */}
                  <label className={`payment-option-label ${paymentMethod === 'VODAFONE_CASH' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VODAFONE_CASH"
                      checked={paymentMethod === 'VODAFONE_CASH'}
                      onChange={() => setPaymentMethod('VODAFONE_CASH')}
                    />
                    <div className="option-icon-box">
                      <Phone size={20} />
                    </div>
                    <div className="option-text">
                      <strong>محفظة فودافون كاش (Vodafone Cash)</strong>
                      <span>تحويل إلكتروني مباشر عبر محفظة الهاتف.</span>
                    </div>
                  </label>
                </div>

                {/* Conditional Payment Proof Fields */}
                {paymentMethod === 'INSTAPAY' && (
                  <div className="payment-instructions-box">
                    <div className="inst-title">
                      <ShieldCheck size={18} />
                      <span>تعليمات تحويل إنستاباي:</span>
                    </div>
                    <p>
                      يرجى تحويل مبلغ <strong>{total.toLocaleString('en-US')} ج.م</strong> إلى معرف إنستاباي:
                    </p>
                    <div className="account-number-copy" dir="ltr">
                      01017719898@instapay
                    </div>
                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label htmlFor="instapay-ref">الرقم المرجعي للتحويل (Reference No) *</label>
                      <input
                        id="instapay-ref"
                        type="text"
                        required
                        placeholder="أدخل الرقم المرجعي للعملية الظاهر في إيصال إنستاباي"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'VODAFONE_CASH' && (
                  <div className="payment-instructions-box">
                    <div className="inst-title">
                      <Phone size={18} />
                      <span>تعليمات تحويل فودافون كاش:</span>
                    </div>
                    <p>
                      يرجى تحويل مبلغ <strong>{total.toLocaleString('en-US')} ج.م</strong> إلى رقم المحفظة:
                    </p>
                    <div className="account-number-copy" dir="ltr">
                      01017719898
                    </div>
                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label htmlFor="voda-phone">رقم المحفظة التي قمت بالتحويل منها</label>
                      <input
                        id="voda-phone"
                        type="tel"
                        dir="ltr"
                        placeholder="010XXXXXXXX"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="voda-ref">رقم العملية أو كود التأكيد *</label>
                      <input
                        id="voda-ref"
                        type="text"
                        required
                        placeholder="أدخل رقم العملية أو كود التأكيد المستلم في رسالة فودافون"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Left Column: Order Summary */}
          <div className="checkout-summary-column">
            <div className="checkout-summary-card">
              <h3>ملخص المشتريات</h3>

              <div className="summary-items-list">
                {items.map((item) => (
                  <div key={item.id} className="summary-item-row">
                    <div className="item-info">
                      <span className="item-qty">{item.quantity}x</span>
                      <div>
                        <strong className="item-name">{item.nameAr}</strong>
                        <span className="item-sku">SKU: {item.sku}</span>
                      </div>
                    </div>
                    <div className="item-price">
                      <span>{Number(item.totalPrice).toLocaleString('en-US')} ج.م</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-calc-list">
                <div className="calc-row">
                  <span>المجموع الفرعي للمنتجات:</span>
                  <strong>{subtotal.toLocaleString('en-US')} ج.م</strong>
                </div>
                <div className="calc-row">
                  <span>تكلفة الشحن والتوصيل ({activeGov.nameAr}):</span>
                  <strong>{deliveryFee > 0 ? `${deliveryFee} ج.م` : 'مجاناً'}</strong>
                </div>
                <div className="calc-row total-row">
                  <span>الإجمالي النهائي المطلوب:</span>
                  <strong className="total-amount">{total.toLocaleString('en-US')} ج.م</strong>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block place-order-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ButtonLoader loadingText="جاري تسجيل وتأكيد الطلب..." size="sm" color="white" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>تأكيد وتسجيل الطلب الآن</span>
                  </>
                )}
              </button>

              <div className="guarantee-note">
                <ShieldCheck size={16} className="gold-text" />
                <span>تحت إشراف باش مهندس أحمد السيد • ضمان معتمد</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
