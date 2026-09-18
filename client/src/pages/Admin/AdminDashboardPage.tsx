import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  Settings,
  Users,
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  Tv,
  Camera,
  HardDrive,
  Wifi,
  ExternalLink,
  ChevronLeft,
  Truck,
  MapPin,
  Calendar,
  Filter,
  DollarSign
} from 'lucide-react';
import { adminService } from '../../services/api/adminService';
import { exchangeRateService } from '../../services/api/exchangeRateService';
import {
  AdminMetrics,
  Product,
  Category,
  CarouselSlide,
  Order,
  StoreSettings,
  CustomerProfile,
  AuditLog,
  OrderStatus,
  PricingMode,
  ExchangeRateRecord,
  GovernorateShippingRate
} from '../../types';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { PageLoader, Spinner, ButtonLoader } from '../../components/feedback';
import './AdminDashboardPage.css';

export const DEFAULT_EGYPT_GOVERNORATES: GovernorateShippingRate[] = [
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

type AdminTab =
  | 'OVERVIEW'
  | 'PRODUCTS'
  | 'CATEGORIES'
  | 'CAROUSEL'
  | 'ORDERS'
  | 'EXCHANGE_RATE'
  | 'SETTINGS'
  | 'SHIPPING'
  | 'CUSTOMERS'
  | 'AUDIT';

interface AdminDashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rateHistory, setRateHistory] = useState<ExchangeRateRecord[]>([]);

  // Period filter for customers
  const [customerPeriod, setCustomerPeriod] = useState<'all' | 'week' | 'month' | 'year'>('all');

  // Shipping rates list
  const [shippingRatesList, setShippingRatesList] = useState<GovernorateShippingRate[]>(DEFAULT_EGYPT_GOVERNORATES);
  const [uniformFeeInput, setUniformFeeInput] = useState<string>('');
  const [isSavingShipping, setIsSavingShipping] = useState<boolean>(false);

  // Modals & form states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingSlide, setEditingSlide] = useState<Partial<CarouselSlide> | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Rate override form
  const [manualRateInput, setManualRateInput] = useState<string>('');
  const [rateNotes, setRateNotes] = useState<string>('');
  const [isSyncingRate, setIsSyncingRate] = useState<boolean>(false);

  // Order verify action
  const [verifyNotes, setVerifyNotes] = useState<string>('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTabData = async (tab: AdminTab, periodOverride?: 'all' | 'week' | 'month' | 'year') => {
    setLoading(true);
    try {
      if (tab === 'OVERVIEW') {
        const data = await adminService.getOverview();
        if (data?.metrics) {
          setMetrics(data.metrics);
          setManualRateInput(String(data.metrics.currentUsdRate || ''));
        }
      } else if (tab === 'PRODUCTS') {
        const [pData, cData] = await Promise.all([
          adminService.getProducts({ limit: 100 }),
          adminService.getCategories(),
        ]);
        setProducts(pData.products || []);
        setCategories(cData || []);
      } else if (tab === 'CATEGORIES') {
        const cData = await adminService.getCategories();
        setCategories(cData || []);
      } else if (tab === 'CAROUSEL') {
        const sData = await adminService.getCarouselSlides();
        setSlides(sData || []);
      } else if (tab === 'ORDERS') {
        const oData = await adminService.getOrders();
        setOrders(oData.orders || []);
      } else if (tab === 'EXCHANGE_RATE') {
        const [currentRate, history] = await Promise.all([
          exchangeRateService.getCurrentRate(),
          exchangeRateService.getRateHistory(20),
        ]);
        setManualRateInput(String(currentRate.rate || currentRate || ''));
        setRateHistory(history || []);
      } else if (tab === 'SETTINGS') {
        const s = await adminService.getSettings();
        setStoreSettings(s);
      } else if (tab === 'SHIPPING') {
        const s = await adminService.getSettings();
        setStoreSettings(s);
        if (s?.shipping_rates && Array.isArray(s.shipping_rates) && s.shipping_rates.length > 0) {
          setShippingRatesList(s.shipping_rates);
        } else {
          setShippingRatesList(DEFAULT_EGYPT_GOVERNORATES);
        }
      } else if (tab === 'CUSTOMERS') {
        const p = periodOverride || customerPeriod;
        const c = await adminService.getCustomers({ period: p });
        setCustomers(c || []);
      } else if (tab === 'AUDIT') {
        const l = await adminService.getAuditLogs({ limit: 50 });
        setAuditLogs(l || []);
      }
    } catch (err: any) {
      showToast(err.message || 'فشل في تحميل بيانات القسم', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  // Handle Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        await adminService.updateProduct(editingProduct.id, editingProduct);
        showToast('تم تحديث المنتج بنجاح');
      } else {
        await adminService.createProduct(editingProduct);
        showToast('تمت إضافة المنتج بنجاح');
      }
      setEditingProduct(null);
      loadTabData('PRODUCTS');
    } catch (err: any) {
      showToast(err.message || 'فشل في حفظ المنتج', 'error');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تعطيل هذا المنتج؟')) return;
    try {
      await adminService.deleteProduct(id);
      showToast('تم تعطيل المنتج');
      loadTabData('PRODUCTS');
    } catch (err: any) {
      showToast(err.message || 'فشل تعطيل المنتج', 'error');
    }
  };

  // Handle Manual Rate Override
  const handleSetManualRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(manualRateInput);
    if (isNaN(rateVal) || rateVal <= 0) {
      showToast('سعر الصرف المدخل غير صالح', 'error');
      return;
    }
    try {
      await exchangeRateService.setManualRate(rateVal, rateNotes || undefined);
      showToast(`تم تعيين سعر الصرف يدوياً: 1 دولار = ${rateVal.toFixed(2)} ج.م`);
      setRateNotes('');
      loadTabData('EXCHANGE_RATE');
    } catch (err: any) {
      showToast(err.message || 'فشل تعديل سعر الصرف', 'error');
    }
  };

  // Handle Sync Rate
  const handleSyncRate = async () => {
    try {
      setIsSyncingRate(true);
      const res = await exchangeRateService.syncDailyRate();
      if (res.success) {
        showToast(res.message);
        loadTabData('EXCHANGE_RATE');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'فشل المزامنة', 'error');
    } finally {
      setIsSyncingRate(false);
    }
  };

  // Handle Verify Payment Action
  const handleVerifyPayment = async (orderId: string, action: 'CONFIRM' | 'REJECT' | 'REQUEST_CORRECTION') => {
    try {
      const updated = await adminService.verifyPayment(orderId, action, verifyNotes || undefined);
      showToast(action === 'CONFIRM' ? 'تم اعتماد التحويل وتأكيد الطلب' : 'تم تحديث حالة الدفع');
      setSelectedOrder(updated);
      setVerifyNotes('');
      loadTabData('ORDERS');
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث حالة الدفع', 'error');
    }
  };

  // Handle Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await adminService.updateOrderStatus(orderId, newStatus);
      showToast(`تم تحديث حالة الطلب إلى: ${newStatus}`);
      setSelectedOrder(updated);
      loadTabData('ORDERS');
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث حالة الطلب', 'error');
    }
  };

  // Handle Delete Single Audit Log
  const handleDeleteAuditLog = async (id: number | string) => {
    if (!window.confirm('هل تريد حذف هذا النشاط من السجل؟')) return;
    try {
      await adminService.deleteAuditLog(id);
      setAuditLogs((prev) => prev.filter((log) => String(log.id) !== String(id)));
      showToast('تم حذف النشاط بنجاح');
    } catch (err: any) {
      showToast(err.message || 'فشل حذف النشاط', 'error');
    }
  };

  // Handle Delete All Audit Logs
  const handleDeleteAllAuditLogs = async () => {
    if (
      !window.confirm(
        'هل أنت متأكد من رغبتك في حذف وتفريغ جميع سجلات النشاطات؟ لا يمكن التراجع عن هذا الإجراء.'
      )
    ) {
      return;
    }
    try {
      await adminService.deleteAllAuditLogs();
      setAuditLogs([]);
      showToast('تم تفريغ وحذف جميع سجلات النشاطات بنجاح');
    } catch (err: any) {
      showToast(err.message || 'فشل تفريغ سجل النشاطات', 'error');
    }
  };

  return (
    <div className="hts-admin-dashboard">
      <SEOHead
        title="لوحة تحكم الإدارة والعمليات"
        description="لوحة تحكم إدارة متجر هايبر تكنولوجي، إدارة المنتجات، الأسعار، الطلبات، وسعر الصرف."
      />
      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand-header">
          <ShieldCheck size={26} className="gold-text" />
          <div>
            <h3>إدارة هايبر تكنولوجي</h3>
            <span>لوحة التحكم والعمليات</span>
          </div>
        </div>

        <nav className="admin-nav-menu">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
            onClick={() => setActiveTab('OVERVIEW')}
          >
            <TrendingUp size={18} />
            <span>نظرة عامة ومؤشرات</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'PRODUCTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PRODUCTS')}
          >
            <Package size={18} />
            <span>إدارة المنتجات والأجهزة</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'CATEGORIES' ? 'active' : ''}`}
            onClick={() => setActiveTab('CATEGORIES')}
          >
            <Layers size={18} />
            <span>أقسام المتجر</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'CAROUSEL' ? 'active' : ''}`}
            onClick={() => setActiveTab('CAROUSEL')}
          >
            <Tv size={18} />
            <span>شرائح البانر الرئيسي</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ORDERS')}
          >
            <ShoppingBag size={18} />
            <span>الطلبات ومراجعة الدفع</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'EXCHANGE_RATE' ? 'active' : ''}`}
            onClick={() => setActiveTab('EXCHANGE_RATE')}
          >
            <Sliders size={18} />
            <span>سعر صرف الدولار</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'SETTINGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('SETTINGS')}
          >
            <Settings size={18} />
            <span>بيانات ومعلومات المتجر</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'SHIPPING' ? 'active' : ''}`}
            onClick={() => setActiveTab('SHIPPING')}
          >
            <Truck size={18} />
            <span>أسعار الشحن والمحافظات</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'CUSTOMERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('CUSTOMERS')}
          >
            <Users size={18} />
            <span>سجل العملاء</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'AUDIT' ? 'active' : ''}`}
            onClick={() => setActiveTab('AUDIT')}
          >
            <FileText size={18} />
            <span>سجل النشاطات الإدارية</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-viewport">
        {loading && (
          <div style={{ padding: '20px 0' }}>
            <PageLoader message="جاري جلب وتحديث بيانات لوحة التحكم..." />
          </div>
        )}

        {/* Tab 1: Overview */}
        {!loading && activeTab === 'OVERVIEW' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>مؤشرات وإحصائيات المتجر المباشرة</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadTabData('OVERVIEW')}>
                <RefreshCw size={14} /> <span>تحديث</span>
              </button>
            </div>

            {metrics && (
              <div className="metrics-cards-grid">
                <div className="metric-box">
                  <span className="box-label">طلبات اليوم</span>
                  <strong className="box-val">{metrics.todayOrders}</strong>
                  <span className="box-sub">طلبات جديدة مسجلة</span>
                </div>

                <div className="metric-box alert-box">
                  <span className="box-label">تحويلات قيد التحقق</span>
                  <strong className="box-val gold-text">{metrics.pendingPaymentVerifications}</strong>
                  <span className="box-sub">إنستاباي وفودافون كاش</span>
                </div>

                <div className="metric-box">
                  <span className="box-label">تنبيهات المخزون المنخفض</span>
                  <strong className="box-val">{metrics.lowStockItems}</strong>
                  <span className="box-sub">أجهزة قاربت على النفاد</span>
                </div>

                <div className="metric-box">
                  <span className="box-label">إجمالي الأجهزة النشطة</span>
                  <strong className="box-val">{metrics.totalActiveProducts}</strong>
                  <span className="box-sub">منتج معروض بالكتالوج</span>
                </div>

                <div className="metric-box">
                  <span className="box-label">إجمالي العملاء</span>
                  <strong className="box-val">{metrics.totalCustomers}</strong>
                  <span className="box-sub">عميل مسجل بالنظام</span>
                </div>

                <div className="metric-box highlight-box">
                  <span className="box-label">سعر الدولار المعتمد اليوم</span>
                  <strong className="box-val" dir="ltr">{Number(metrics.currentUsdRate).toFixed(2)} EGP</strong>
                  <span className="box-sub">
                    {metrics.isManualOverride ? 'تعديل يدوي من الإدارة' : 'تحديث تلقائي'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Products CRUD */}
        {activeTab === 'PRODUCTS' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>إدارة كتالوج المنتجات والأجهزة</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  setEditingProduct({
                    name_ar: '',
                    name_en: '',
                    sku: `HTS-${Date.now().toString().slice(-4)}`,
                    category_id: categories[0]?.id || '',
                    pricing_mode: 'FIXED_EGP',
                    base_cost: 0,
                    base_currency: 'EGP',
                    profit_margin_percent: 15,
                    manual_egp_price: 0,
                    stock_quantity: 10,
                    low_stock_threshold: 3,
                    is_available: true,
                    is_active: true,
                    specifications: {},
                  })
                }
              >
                <Plus size={16} /> <span>إضافة جهاز جديد</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>الجهاز / الموديل</th>
                    <th>SKU</th>
                    <th>القسم</th>
                    <th>طريقة التسعير</th>
                    <th>السعر الحالي (ج.م)</th>
                    <th>المخزون</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const price = p.pricing?.sellingPriceEgp ?? p.manual_egp_price;
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name_ar}</strong>
                          {p.brand_name && <span className="table-sub-tag">{p.brand_name}</span>}
                        </td>
                        <td dir="ltr" className="sku-cell">{p.sku}</td>
                        <td>{p.category_name_ar || 'عام'}</td>
                        <td>
                          <span className={`pricing-mode-pill ${p.pricing_mode}`}>
                            {p.pricing_mode === 'USD_LINKED' ? 'مرتبط بالدولار' : 'سعر جنيه ثابت'}
                          </span>
                        </td>
                        <td className="price-cell">{Number(price).toLocaleString('en-US')} ج.م</td>
                        <td>
                          <span className={`stock-pill ${p.stock_quantity <= p.low_stock_threshold ? 'low' : ''}`}>
                            {p.stock_quantity} قطعة
                          </span>
                        </td>
                        <td>
                          <span className={`status-dot ${p.is_available && p.is_active ? 'active' : 'inactive'}`}>
                            {p.is_available && p.is_active ? 'معروض' : 'غير متوفر'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="تعديل"
                              onClick={() => setEditingProduct(p)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              title="تعطيل"
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product Edit / Create Modal */}
            {editingProduct && (
              <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
                <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{editingProduct.id ? 'تعديل بيانات الجهاز' : 'إضافة جهاز جديد إلى الكتالوج'}</h3>
                    <button type="button" className="close-btn" onClick={() => setEditingProduct(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="admin-modal-form">
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>اسم الجهاز بالعربية *</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.name_ar || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name_ar: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>الاسم بالإنجليزية</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={editingProduct.name_en || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row-3">
                      <div className="form-group">
                        <label>كود الموديل / SKU *</label>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          value={editingProduct.sku || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>القسم الرئيسي *</label>
                        <select
                          value={editingProduct.category_id || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name_ar}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>نظام التسعير *</label>
                        <select
                          value={editingProduct.pricing_mode || 'FIXED_EGP'}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              pricing_mode: e.target.value as PricingMode,
                              base_currency: e.target.value === 'USD_LINKED' ? 'USD' : 'EGP',
                            })
                          }
                        >
                          <option value="FIXED_EGP">سعر ثابت بالجنيه المصري (FIXED_EGP)</option>
                          <option value="USD_LINKED">تسعير مرتبط بالدولار (USD_LINKED)</option>
                        </select>
                      </div>
                    </div>

                    {editingProduct.pricing_mode === 'USD_LINKED' ? (
                      <div className="form-row-3 highlight-inputs">
                        <div className="form-group">
                          <label>تكلفة الشراء بالدولار ($) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={editingProduct.base_cost || ''}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, base_cost: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>هامش الربح (%) *</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={editingProduct.profit_margin_percent || ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                profit_margin_percent: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>خصم إضافي (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editingProduct.discount_percent || 0}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                discount_percent: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>سعر البيع المباشر بالجنيه (ج.م) *</label>
                          <input
                            type="number"
                            step="1"
                            required
                            value={editingProduct.manual_egp_price || ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                manual_egp_price: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>السعر قبل الخصم (اختياري)</label>
                          <input
                            type="number"
                            step="1"
                            value={editingProduct.old_price || ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                old_price: parseFloat(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="form-row-3">
                      <div className="form-group">
                        <label>الكمية بالمخزن *</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.stock_quantity ?? 10}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              stock_quantity: parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>حد التنبيه للكمية</label>
                        <input
                          type="number"
                          value={editingProduct.low_stock_threshold ?? 3}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              low_stock_threshold: parseInt(e.target.value, 10) || 3,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>شهور الضمان المعتمد</label>
                        <input
                          type="text"
                          placeholder="مثال: ضمان 24 شهراً معتمد"
                          value={editingProduct.warranty_info || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, warranty_info: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>رابط صورة المنتج (URL)</label>
                      <input
                        type="url"
                        dir="ltr"
                        placeholder="https://..."
                        value={editingProduct.image_url || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>الوصف الفني والتفاصيل</label>
                      <textarea
                        rows={3}
                        value={editingProduct.description_ar || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description_ar: e.target.value })
                        }
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary">
                        <span>حفظ الجهاز بالكتالوج</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingProduct(null)}
                      >
                        <span>إلغاء</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Categories CRUD */}
        {activeTab === 'CATEGORIES' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>أقسام المتجر الإلكتروني</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  setEditingCategory({
                    name_ar: '',
                    name_en: '',
                    slug: '',
                    icon_name: 'Layers',
                    sort_order: categories.length + 1,
                    is_active: true,
                  })
                }
              >
                <Plus size={16} /> <span>إضافة قسم</span>
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>اسم القسم</th>
                    <th>Slug</th>
                    <th>الترتيب</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name_ar}</strong></td>
                      <td dir="ltr" className="sku-cell">{c.slug}</td>
                      <td>{c.sort_order}</td>
                      <td>
                        <span className={`status-dot ${c.is_active ? 'active' : 'inactive'}`}>
                          {c.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="action-icon-btn" onClick={() => setEditingCategory(c)}>
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingCategory && (
              <div className="admin-modal-overlay" onClick={() => setEditingCategory(null)}>
                <div className="admin-modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{editingCategory.id ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
                    <button type="button" className="close-btn" onClick={() => setEditingCategory(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        if (editingCategory.id) {
                          await adminService.updateCategory(editingCategory.id, editingCategory);
                        } else {
                          await adminService.createCategory(editingCategory);
                        }
                        showToast('تم حفظ القسم بنجاح');
                        setEditingCategory(null);
                        loadTabData('CATEGORIES');
                      } catch (err: any) {
                        showToast(err.message || 'فشل حفظ القسم', 'error');
                      }
                    }}
                    className="admin-modal-form"
                  >
                    <div className="form-group">
                      <label>اسم القسم بالعربية *</label>
                      <input
                        type="text"
                        required
                        value={editingCategory.name_ar || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name_ar: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>الاسم بالإنجليزية *</label>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={editingCategory.name_en || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name_en: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>معرف الرابط (Slug) *</label>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={editingCategory.slug || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary"><span>حفظ</span></button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditingCategory(null)}><span>إلغاء</span></button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Carousel CRUD */}
        {activeTab === 'CAROUSEL' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>شرائح البانر والعروض الرئيسية</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  setEditingSlide({
                    title_ar: '',
                    subtitle_ar: '',
                    image_url: '',
                    button_text_ar: 'تصفح الآن',
                    sort_order: slides.length + 1,
                    is_active: true,
                  })
                }
              >
                <Plus size={16} /> <span>إضافة شريحة عرض</span>
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>العنوان الرئيسي</th>
                    <th>الوصف المختصر</th>
                    <th>الترتيب</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.title_ar}</strong></td>
                      <td>{s.subtitle_ar}</td>
                      <td>{s.sort_order}</td>
                      <td>
                        <span className={`status-dot ${s.is_active ? 'active' : 'inactive'}`}>
                          {s.is_active ? 'معروض' : 'مخفي'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="action-icon-btn" onClick={() => setEditingSlide(s)}>
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn delete-btn"
                            onClick={async () => {
                              if (!window.confirm('حذف هذه الشريحة؟')) return;
                              await adminService.deleteCarouselSlide(s.id);
                              showToast('تم حذف الشريحة');
                              loadTabData('CAROUSEL');
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingSlide && (
              <div className="admin-modal-overlay" onClick={() => setEditingSlide(null)}>
                <div className="admin-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{editingSlide.id ? 'تعديل الشريحة' : 'إضافة شريحة جديدة'}</h3>
                    <button type="button" className="close-btn" onClick={() => setEditingSlide(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        if (editingSlide.id) {
                          await adminService.updateCarouselSlide(editingSlide.id, editingSlide);
                        } else {
                          await adminService.createCarouselSlide(editingSlide);
                        }
                        showToast('تم حفظ الشريحة بنجاح');
                        setEditingSlide(null);
                        loadTabData('CAROUSEL');
                      } catch (err: any) {
                        showToast(err.message || 'فشل حفظ الشريحة', 'error');
                      }
                    }}
                    className="admin-modal-form"
                  >
                    <div className="form-group">
                      <label>عنوان العرض الرئيسي بالعربية *</label>
                      <input
                        type="text"
                        required
                        value={editingSlide.title_ar || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, title_ar: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>الوصف الترويجي</label>
                      <textarea
                        rows={2}
                        value={editingSlide.subtitle_ar || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, subtitle_ar: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>رابط صورة الخلفية (URL) *</label>
                      <input
                        type="url"
                        required
                        dir="ltr"
                        placeholder="https://..."
                        value={editingSlide.image_url || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, image_url: e.target.value })}
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary"><span>حفظ</span></button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditingSlide(null)}><span>إلغاء</span></button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Orders & Payment Verification */}
        {activeTab === 'ORDERS' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>الطلبات والتحقق من عمليات الدفع</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadTabData('ORDERS')}>
                <RefreshCw size={14} /> <span>تحديث</span>
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>الهاتف</th>
                    <th>طريقة الدفع</th>
                    <th>الرقم المرجعي للدفع</th>
                    <th>الإجمالي (ج.م)</th>
                    <th>حالة الطلب</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="sku-cell"><strong>{o.order_number}</strong></td>
                      <td>{o.customer_name}</td>
                      <td dir="ltr">{o.customer_phone}</td>
                      <td>
                        <span className="payment-method-tag">
                          {o.payment_method === 'CASH_ON_DELIVERY' ? 'استلام' : o.payment_method === 'INSTAPAY' ? 'إنستاباي' : 'فودافون كاش'}
                        </span>
                      </td>
                      <td>
                        {o.payment_reference ? (
                          <span className="ref-tag" dir="ltr">{o.payment_reference}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="price-cell">{Number(o.total).toLocaleString('en-US')} ج.م</td>
                      <td>
                        <span className={`status-pill status-${o.order_status.toLowerCase()}`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedOrder(o)}
                        >
                          <Eye size={14} /> <span>معاينة واعتماد</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Detail & Payment Approval Modal */}
            {selectedOrder && (
              <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
                <div className="admin-modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>تفاصيل واعتماد الطلب #{selectedOrder.order_number}</h3>
                    <button type="button" className="close-btn" onClick={() => setSelectedOrder(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>

                  <div className="order-modal-details">
                    <div className="detail-meta-grid">
                      <div><span>العميل:</span> <strong>{selectedOrder.customer_name}</strong></div>
                      <div><span>الهاتف:</span> <strong dir="ltr">{selectedOrder.customer_phone}</strong></div>
                      <div><span>طريقة الدفع:</span> <strong>{selectedOrder.payment_method}</strong></div>
                      <div><span>حالة الدفع:</span> <strong>{selectedOrder.payment_status}</strong></div>
                      <div className="full-col"><span>عنوان التوصيل:</span> <strong>{selectedOrder.delivery_address}</strong></div>
                    </div>

                    {selectedOrder.payment_reference && (
                      <div className="proof-review-box">
                        <h4>الرقم المرجعي للتحويل المسجل:</h4>
                        <div className="ref-large" dir="ltr">{selectedOrder.payment_reference}</div>
                        {selectedOrder.payer_phone && <p>رقم المحفظة المحول منها: {selectedOrder.payer_phone}</p>}

                        <div className="form-group" style={{ marginTop: '12px' }}>
                          <label>ملاحظات الاعتماد / الرفض:</label>
                          <input
                            type="text"
                            placeholder="ملاحظات تظهر بسجل الحالة"
                            value={verifyNotes}
                            onChange={(e) => setVerifyNotes(e.target.value)}
                          />
                        </div>

                        <div className="verify-actions-row">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm approve-btn"
                            onClick={() => handleVerifyPayment(selectedOrder.id, 'CONFIRM')}
                          >
                            <CheckCircle2 size={16} /> <span>تأكيد استلام الدفعة واعتماد الطلب</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm reject-btn"
                            onClick={() => handleVerifyPayment(selectedOrder.id, 'REJECT')}
                          >
                            <XCircle size={16} /> <span>رفض إثبات الدفع</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="status-change-box">
                      <label>تغيير حالة الطلب:</label>
                      <div className="status-buttons-flow">
                        {([
                          { value: 'CONFIRMED', label: 'مؤكد' },
                          { value: 'PROCESSING', label: 'جاري التجهيز' },
                          { value: 'READY', label: 'جاهز للتسليم' },
                          { value: 'OUT_FOR_DELIVERY', label: 'جاري التوصيل' },
                          { value: 'DELIVERED', label: 'تم الاستلام' },
                          { value: 'CANCELLED', label: 'ملغي' },
                        ] as { value: OrderStatus; label: string }[]).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            className={`status-flow-btn ${selectedOrder.order_status === value ? 'active' : ''}`}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, value)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Exchange Rate */}
        {activeTab === 'EXCHANGE_RATE' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>التحكم في سعر صرف الدولار مقابل الجنيه</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSyncRate}
                disabled={isSyncingRate}
              >
                <RefreshCw size={14} className={isSyncingRate ? 'spin' : ''} />
                <span>{isSyncingRate ? 'جاري المزامنة...' : 'مزامنة السعر اليومي تلقائياً'}</span>
              </button>
            </div>

            <div className="rate-control-grid">
              <div className="rate-override-card">
                <h3>التعديل اليدوي المباشر لسعر الصرف</h3>
                <p>
                  يتم تطبيق هذا السعر فوراً على جميع المنتجات المسعرة بنظام <strong>USD_LINKED</strong> (كاميرات المراقبة والشاشات المرتبطة).
                </p>

                <form onSubmit={handleSetManualRate} className="rate-form">
                  <div className="form-group">
                    <label>سعر 1 دولار أمريكي بالجنيه المصري (USD/EGP) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      dir="ltr"
                      value={manualRateInput}
                      onChange={(e) => setManualRateInput(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>سبب التعديل أو ملاحظات</label>
                    <input
                      type="text"
                      placeholder="مثال: تحديث سعر الصرف للسوق المحلي اليوم"
                      value={rateNotes}
                      onChange={(e) => setRateNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    <span>حفظ واعتماد سعر الصرف الجديد</span>
                  </button>
                </form>
              </div>

              <div className="rate-history-card">
                <h3>سجل أسعار الصرف التاريخية</h3>
                <div className="rate-history-list">
                  {rateHistory.map((rh) => (
                    <div key={rh.id} className="rate-history-row">
                      <div>
                        <strong>1 USD = {Number(rh.rate).toFixed(2)} EGP</strong>
                        <span className="source-tag">{rh.source}</span>
                      </div>
                      <span className="date-tag">
                        {new Date(rh.effective_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Store Settings */}
        {activeTab === 'SETTINGS' && (
          <div className="admin-tab-pane">
            <div className="pane-header">
              <h2>إعدادات المتجر وبيانات الاتصال والتحويل</h2>
            </div>

            {storeSettings && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await adminService.updateSettings(storeSettings);
                    showToast('تم حفظ الإعدادات بنجاح');
                  } catch (err: any) {
                    showToast(err.message || 'فشل حفظ الإعدادات', 'error');
                  }
                }}
                className="settings-card-form"
              >
                <div className="form-row-2">
                  <div className="form-group">
                    <label>اسم المتجر بالعربية</label>
                    <input
                      type="text"
                      value={storeSettings.store_name_ar || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name_ar: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>اسم المشرف الهندسي</label>
                    <input
                      type="text"
                      value={storeSettings.supervisor_name_ar || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, supervisor_name_ar: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>رقم هاتف المعرض والتواصل</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={storeSettings.phone || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>مواعيد العمل الرسمية</label>
                    <input
                      type="text"
                      value={storeSettings.working_hours_ar || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, working_hours_ar: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>عنوان المعرض بالسويس بالتفصيل</label>
                  <textarea
                    rows={2}
                    value={storeSettings.address_ar || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, address_ar: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>تعليمات تحويل إنستاباي (تظهر للعميل في صفحة الدفع)</label>
                  <textarea
                    rows={2}
                    value={storeSettings.instapay_info || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, instapay_info: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>تعليمات تحويل فودافون كاش (تظهر للعميل في صفحة الدفع)</label>
                  <textarea
                    rows={2}
                    value={storeSettings.vodafone_cash_info || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, vodafone_cash_info: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  <span>حفظ جميع إعدادات المتجر</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 8: Shipping Rates Management */}
        {activeTab === 'SHIPPING' && (
          <div className="admin-tab-pane">
            <div className="pane-header shipping-pane-header">
              <div>
                <h2>إدارة أسعار الشحن والتوصيل للمحافظات</h2>
                <p className="pane-subtitle">
                  تعديل سعر التوصيل لكل محافظة من الـ 27 محافظة مصرية أو تطبيق سعر موحد. يتم تطبيق الأسعار فوراً في صفحة إتمام الطلب (Checkout).
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSavingShipping}
                onClick={async () => {
                  try {
                    setIsSavingShipping(true);
                    await adminService.updateSettings({ shipping_rates: shippingRatesList });
                    showToast('تم حفظ أسعار الشحن لكافة المحافظات بنجاح');
                  } catch (err: any) {
                    showToast(err.message || 'فشل حفظ أسعار الشحن', 'error');
                  } finally {
                    setIsSavingShipping(false);
                  }
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSavingShipping ? 'جاري الحفظ...' : 'حفظ أسعار الشحن'}</span>
              </button>
            </div>

            {/* Quick Bulk Update Bar */}
            <div className="shipping-quick-bar">
              <div className="quick-bar-inner">
                <span className="quick-label">تطبيق سعر شحن موحد على جميع المحافظات:</span>
                <div className="quick-input-group">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="مثال: 50"
                    value={uniformFeeInput}
                    onChange={(e) => setUniformFeeInput(e.target.value)}
                  />
                  <span className="currency-unit">ج.م</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const val = parseFloat(uniformFeeInput);
                      if (isNaN(val) || val < 0) {
                        showToast('يرجى إدخال مبلغ صحيح', 'error');
                        return;
                      }
                      setShippingRatesList((prev) => prev.map((item) => ({ ...item, fee: val })));
                      showToast(`تم تعيين سعر ${val} ج.م لجميع المحافظات. اضغط حفظ للتأكيد.`);
                    }}
                  >
                    <span>تطبيق على الكل</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShippingRatesList(DEFAULT_EGYPT_GOVERNORATES);
                      showToast('تمت استعادة الأسعار الافتراضية. اضغط حفظ للتأكيد.');
                    }}
                  >
                    <span>استعادة الافتراضي</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 27 Governorates Grid */}
            <div className="shipping-govs-grid">
              {shippingRatesList.map((gov, idx) => (
                <div key={gov.id} className="gov-shipping-card">
                  <div className="gov-info">
                    <span className="gov-index">{idx + 1}</span>
                    <strong className="gov-name">{gov.nameAr}</strong>
                  </div>
                  <div className="gov-price-input-group">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={gov.fee}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setShippingRatesList((prev) =>
                          prev.map((item) => (item.id === gov.id ? { ...item, fee: val } : item))
                        );
                      }}
                    />
                    <span className="currency-unit">ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 9: Customers */}
        {activeTab === 'CUSTOMERS' && (
          <div className="admin-tab-pane">
            <div className="pane-header customers-pane-header">
              <div>
                <h2>سجل العملاء والنشاط الشرائي</h2>
                <p className="pane-subtitle">
                  متابعة حسابات العملاء المسجلين، عدد الطلبات المعتمدة، وإجمالي الإنفاق مع فلاتر زمنية دقيقة.
                </p>
              </div>
              <div className="period-filter-buttons">
                <button
                  type="button"
                  className={`period-btn ${customerPeriod === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerPeriod('all');
                    loadTabData('CUSTOMERS', 'all');
                  }}
                >
                  <span>كل الأوقات</span>
                </button>
                <button
                  type="button"
                  className={`period-btn ${customerPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerPeriod('week');
                    loadTabData('CUSTOMERS', 'week');
                  }}
                >
                  <span>هذا الأسبوع</span>
                </button>
                <button
                  type="button"
                  className={`period-btn ${customerPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerPeriod('month');
                    loadTabData('CUSTOMERS', 'month');
                  }}
                >
                  <span>هذا الشهر</span>
                </button>
                <button
                  type="button"
                  className={`period-btn ${customerPeriod === 'year' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerPeriod('year');
                    loadTabData('CUSTOMERS', 'year');
                  }}
                >
                  <span>هذا العام</span>
                </button>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>اسم العميل</th>
                    <th>الهاتف</th>
                    <th>البريد الإلكتروني</th>
                    <th>
                      عدد الطلبات (
                      {customerPeriod === 'week'
                        ? 'الأسبوع'
                        : customerPeriod === 'month'
                        ? 'الشهر'
                        : customerPeriod === 'year'
                        ? 'السنة'
                        : 'الإجمالي'}
                      )
                    </th>
                    <th>إجمالي الإنفاق (ج.م)</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        لا يوجد عملاء مسجلين في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.id}>
                        <td><strong>{cust.full_name}</strong></td>
                        <td dir="ltr">{cust.phone || cust.auth_phone}</td>
                        <td dir="ltr">{cust.email || '-'}</td>
                        <td>
                          <span className="badge-count">{cust.orders_count || 0} طلب</span>
                        </td>
                        <td className="price-cell">
                          <strong>{Number(cust.total_spent || 0).toLocaleString('en-US')}</strong> ج.م
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 10: Recent Activity Log */}
        {activeTab === 'AUDIT' && (
          <div className="admin-tab-pane">
            <div className="pane-header audit-pane-header">
              <div>
                <h2>سجل النشاطات والأحداث الأخيرة</h2>
                <p className="pane-subtitle">
                  سجل مبسط ومفهوم باللغة العربية لجميع العمليات الإدارية، تأكيد الدفع، وتعديلات الأسعار التي تمت بالمتجر.
                </p>
              </div>
              <div className="pane-actions-group">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadTabData('AUDIT')}>
                  <RefreshCw size={14} /> <span>تحديث السجل</span>
                </button>
                {auditLogs.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={handleDeleteAllAuditLogs}
                    title="تفريغ وحذف جميع سجلات النشاطات لتوفير مساحة في قاعدة البيانات"
                  >
                    <Trash2 size={14} /> <span>حذف الكل</span>
                  </button>
                )}
              </div>
            </div>

            <div className="activity-cards-list">
              {auditLogs.length === 0 ? (
                <div className="empty-activity-box">
                  <Clock size={36} className="gold-text" />
                  <p>لا توجد نشاطات مسجلة حديثاً</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="activity-card-item">
                    <div className="activity-icon-badge">
                      <Clock size={18} />
                    </div>
                    <div className="activity-main-info">
                      <div className="activity-header-row">
                        <div className="activity-title-group">
                          <strong className="activity-title">{log.title_ar || log.action}</strong>
                          <span className={`activity-pill pill-${log.badge_color || 'info'}`}>
                            {log.action}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="activity-delete-btn"
                          onClick={() => handleDeleteAuditLog(log.id)}
                          title="حذف هذا النشاط من السجل"
                          aria-label="حذف النشاط"
                        >
                          <Trash2 size={15} />
                          <span>حذف</span>
                        </button>
                      </div>
                      <p className="activity-desc">{log.desc_ar || JSON.stringify(log.metadata || {})}</p>
                      <span className="activity-time" dir="ltr">
                        {new Date(log.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
