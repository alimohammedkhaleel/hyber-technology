import React, { useEffect, useState } from 'react';
import { 
  User, 
  MapPin, 
  Package, 
  Check, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  LogOut,
  AlertCircle,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { CustomerProfile, CustomerAddress, Order } from '../../types';
import { customerService } from '../../services/api/customerService';
import { orderService } from '../../services/api/orderService';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { PageLoader, ButtonLoader } from '../../components/feedback';
import './CustomerProfilePage.css';

type ProfileTab = 'INFO' | 'ADDRESSES' | 'ORDERS';

interface CustomerProfilePageProps {
  onNavigate?: (path: string) => void;
}

export const CustomerProfilePage: React.FC<CustomerProfilePageProps> = ({ onNavigate }) => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('INFO');
  const [loading, setLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Addresses
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('المنزل');
  const [newAddressText, setNewAddressText] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('السلام 1');
  const [newCity, setNewCity] = useState<string>('السويس');
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [profileRes, addressesData, ordersData] = await Promise.all([
        customerService.getProfile().catch(() => null),
        customerService.getAddresses().catch(() => []),
        orderService.getOrders().catch(() => []),
      ]);

      if (profileRes?.profile) {
        setProfile(profileRes.profile);
        setFullName(profileRes.profile.full_name || user?.fullName || '');
        setPhone(profileRes.profile.phone || user?.phone || '');
        setEmail(profileRes.profile.email || user?.email || '');
        if (profileRes.addresses) {
          setAddresses(profileRes.addresses);
        }
      } else if (user) {
        setFullName(user.fullName || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
      }

      if (addressesData && addressesData.length > 0) {
        setAddresses(addressesData);
      }
      setOrders(ordersData || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تحميل بيانات الحساب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await customerService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      setSuccessMessage('تم تحديث بياناتك بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تحديث البيانات');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;

    setSavingAddress(true);
    try {
      await customerService.addAddress({
        label: newLabel,
        address: newAddressText.trim(),
        area: newArea.trim(),
        city: newCity.trim(),
        isDefault: addresses.length === 0,
      });
      setSuccessMessage('تمت إضافة العنوان بنجاح');
      setShowAddressForm(false);
      setNewAddressText('');
      const updatedAddrs = await customerService.getAddresses();
      setAddresses(updatedAddrs);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إضافة العنوان');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العنوان؟')) return;
    try {
      await customerService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setSuccessMessage('تم حذف العنوان');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل حذف العنوان');
    }
  };

  return (
    <div className="hts-profile-page">
      <SEOHead
        title="الملف الشخصي والعناوين"
        description="إدارة بياناتك الشخصية وعناوين التوصيل المسجلة وسجل طلباتك في متجر هايبر تكنولوجي."
      />
      <div className="hts-container">
        {/* Header Banner */}
        <div className="profile-header-card">
          <div className="profile-avatar-box">
            <User size={36} />
          </div>
          <div className="profile-user-info">
            <h2>{fullName || 'عميل هايبر تكنولوجي'}</h2>
            <div className="user-contact-badges">
              {phone && (
                <span className="badge-item" dir="ltr">
                  <Phone size={13} /> {phone}
                </span>
              )}
              {email && (
                <span className="badge-item">
                  <Mail size={13} /> {email}
                </span>
              )}
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-sm logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="profile-alert success">
            <Check size={18} />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="profile-alert error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="profile-nav-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'INFO' ? 'active' : ''}`}
            onClick={() => setActiveTab('INFO')}
          >
            <User size={18} />
            <span>البيانات الشخصية</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'ADDRESSES' ? 'active' : ''}`}
            onClick={() => setActiveTab('ADDRESSES')}
          >
            <MapPin size={18} />
            <span>عناوين التوصيل ({addresses.length})</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'ORDERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ORDERS')}
          >
            <Package size={18} />
            <span>طلباتي ({orders.length})</span>
          </button>
        </div>

        {/* Tab 1: Personal Info */}
        {activeTab === 'INFO' && (
          <div className="profile-tab-content">
            <div className="profile-content-card">
              <h3>تعديل البيانات الأساسية</h3>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="p-name">الاسم الكامل *</label>
                  <input
                    id="p-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="p-phone">رقم الهاتف للتواصل *</label>
                  <input
                    id="p-phone"
                    type="tel"
                    dir="ltr"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="p-email">البريد الإلكتروني</label>
                  <input
                    id="p-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  <Check size={16} />
                  <span>{savingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'ADDRESSES' && (
          <div className="profile-tab-content">
            <div className="profile-content-card">
              <div className="card-top-action">
                <h3>عناوين التوصيل المسجلة</h3>
                {!showAddressForm && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus size={16} />
                    <span>إضافة عنوان جديد</span>
                  </button>
                )}
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="add-address-form">
                  <h4>تفاصيل العنوان الجديد</h4>
                  <div className="form-group">
                    <label htmlFor="addr-label">تسمية العنوان (المنزل، العمل، المعرض...)</label>
                    <input
                      id="addr-label"
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="addr-text">العنوان بالتفصيل (الشارع، رقم المبنى، الدور) *</label>
                    <textarea
                      id="addr-text"
                      rows={2}
                      required
                      placeholder="السويس، السلام 1، بجوار..."
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="addr-area">المنطقة / الحي</label>
                      <input
                        id="addr-area"
                        type="text"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="addr-city">المدينة / المحافظة</label>
                      <input
                        id="addr-city"
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingAddress}>
                      <span>{savingAddress ? 'جاري الحفظ...' : 'حفظ العنوان'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAddressForm(false)}
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="addresses-list">
                {addresses.length === 0 ? (
                  <p className="no-addrs-text">لم تقم بإضافة أي عناوين توصيل بعد.</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="address-card-item">
                      <div className="addr-header">
                        <span className="addr-tag">{addr.label}</span>
                        {addr.is_default && <span className="default-pill">افتراضي</span>}
                      </div>
                      <p className="addr-body-text">{addr.address}، {addr.area}، {addr.city}</p>
                      <button
                        type="button"
                        className="delete-addr-btn"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <Trash2 size={15} />
                        <span>حذف</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Orders List */}
        {activeTab === 'ORDERS' && (
          <div className="profile-tab-content">
            <div className="profile-content-card">
              <h3>سجل الطلبات الأخير</h3>
              {orders.length === 0 ? (
                <p className="no-orders-text">لا توجد طلبات مسجلة بحسابك حالياً.</p>
              ) : (
                <div className="profile-orders-list">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="profile-order-row"
                      onClick={() => onNavigate?.(`/orders/${o.id}`)}
                    >
                      <div>
                        <strong>{o.order_number}</strong>
                        <span>{new Date(o.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div>
                        <strong className="order-price">{Number(o.total).toLocaleString('en-US')} ج.م</strong>
                        <span className="view-link">عرض التفاصيل <ChevronLeft size={14} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
