import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/api/customerService';
import { MapPin, Plus, Check, X, Home, Briefcase, Building } from 'lucide-react';
import './AddressModal.css';

const EGYPT_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية', 'الغربية', 'المنوفية',
  'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء',
  'البحر الأحمر', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'الوادي الجديد', 'مطروح'
];

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'الأحساء',
  'القصيم - بريدة', 'عنيزة', 'حائل', 'تبوك', 'أبها', 'خميس مشيط', 'نجران', 'جازان',
  'الطائف', 'ينبع', 'الجبيل', 'حفر الباطن', 'عرعر', 'سكاكا', 'الباحة'
];

const GCC_OTHER_CITIES = [
  'دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الكويت العاصمة', 'حولي', 'الأحمدي',
  'الدوحة', 'الريان', 'المنامة', 'المحرق', 'مسقط', 'صلالة', 'عَمّان', 'إربد'
];

export const AddressModal: React.FC = () => {
  const {
    isAddressModalOpen,
    closeAddressModal,
    addresses,
    selectedAddress,
    selectAddress,
    refreshAddresses,
    isLoadingAddresses
  } = useLocation();

  const { isAuthenticated } = useAuth();

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('مصر');
  const [formData, setFormData] = useState({
    label: 'المنزل',
    city: 'القاهرة',
    area: '',
    address: '',
    building: '',
    floor: '',
    apartment: '',
    delivery_notes: '',
    is_default: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isAddressModalOpen) return null;

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.label || !formData.area || !formData.address || !formData.city) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة (التسمية، الدولة/المدينة، المنطقة، تفاصيل العنوان).');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullCity = selectedCountry !== 'مصر' ? `${selectedCountry} - ${formData.city.trim()}` : formData.city.trim();
      const created = await customerService.createAddress({
        ...formData,
        city: fullCity
      });
      await refreshAddresses();
      selectAddress(created);
      setIsAddingNew(false);
      setFormData({
        label: 'المنزل',
        city: 'القاهرة',
        area: '',
        address: '',
        building: '',
        floor: '',
        apartment: '',
        delivery_notes: '',
        is_default: false
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في إضافة العنوان.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLabelIcon = (label: string) => {
    if (label.includes('منزل') || label.includes('بيت')) return <Home size={16} />;
    if (label.includes('عمل') || label.includes('مكتب') || label.includes('شركة')) return <Briefcase size={16} />;
    return <Building size={16} />;
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    if (country === 'مصر') {
      setFormData((prev) => ({ ...prev, city: 'القاهرة' }));
    } else if (country === 'السعودية') {
      setFormData((prev) => ({ ...prev, city: 'الرياض' }));
    } else if (country === 'الإمارات') {
      setFormData((prev) => ({ ...prev, city: 'دبي' }));
    } else {
      setFormData((prev) => ({ ...prev, city: '' }));
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAddressModal}>
      <div
        className="modal-container address-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={22} className="gold-text" />
            <h3 className="modal-title">
              {isAddingNew ? 'إضافة عنوان توصيل جديد' : 'اختر موقع التوصيل'}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeAddressModal}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!isAuthenticated ? (
            <div className="unauth-address-prompt">
              <p>يرجى تسجيل الدخول لحفظ وإدارة عناوين التوصيل الخاصة بك بدقة وسرعة.</p>
            </div>
          ) : isAddingNew ? (
            <form onSubmit={handleCreateAddress} className="new-address-form">
              {errorMsg && <div className="address-form-error">{errorMsg}</div>}

              {/* Label Preset */}
              <div className="form-group">
                <label className="form-label">تسمية العنوان (المنزل، العمل...)*</label>
                <div className="label-presets-row">
                  {['المنزل', 'العمل', 'أخرى'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      className={`label-preset-btn ${formData.label === lbl ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, label: lbl })}
                    >
                      {getLabelIcon(lbl)}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div className="form-group">
                <label className="form-label">الدولة*</label>
                <div className="country-selector-pills">
                  {[
                    { code: 'مصر', name: 'مصر' },
                    { code: 'السعودية', name: 'المملكة العربية السعودية' },
                    { code: 'الإمارات', name: 'الإمارات العربية المتحدة' },
                    { code: 'الكويت', name: 'دولة الكويت' },
                    { code: 'أخرى', name: 'دول أخرى' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className={`country-pill-btn ${selectedCountry === c.code ? 'active' : ''}`}
                      onClick={() => handleCountryChange(c.code)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* City / Governorate & Area Row */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    {selectedCountry === 'مصر' ? 'المحافظة (27 محافظة مصريـة)*' : 'المدينة / المنطقة الرئيسية*'}
                  </label>

                  {selectedCountry === 'مصر' ? (
                    <select
                      className="form-input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        type="text"
                        list="cities-suggestions"
                        className="form-input"
                        placeholder={selectedCountry === 'السعودية' ? 'مثال: الرياض، جدة، الدمام...' : 'اكتب اسم المدينة أو اختر من القائمة...'}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                      <datalist id="cities-suggestions">
                        {(selectedCountry === 'السعودية' ? SAUDI_CITIES : GCC_OTHER_CITIES).map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">المنطقة / الحي*</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: المعادي، النرجس، العليا، حي الروضة..."
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">الشارع وتفاصيل العنوان*</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="اسم الشارع، رقم البناية، علامة مميزة..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">رقم المبنى</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="12"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الدور</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="3"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رقم الشقة</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="302"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات للمندوب</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: يرجى الاتصال قبل الصعود..."
                  value={formData.delivery_notes}
                  onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                />
              </div>

              <label className="default-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                <span>تعيين كعنوان توصيل افتراضي</span>
              </label>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddingNew(false)}
                >
                  <span>إلغاء</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ العنوان'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="saved-addresses-list">
              {addresses.length === 0 ? (
                <div className="no-addresses-state">
                  <MapPin size={36} className="text-muted" />
                  <p>لا توجد عناوين محفوظة بحسابك حتى الآن.</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`address-card-item ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                    onClick={() => selectAddress(addr)}
                  >
                    <div className="address-card-header">
                      <div className="address-label-badge">
                        {getLabelIcon(addr.label)}
                        <span>{addr.label}</span>
                      </div>
                      {addr.is_default && (
                        <span className="default-badge">افتراضي</span>
                      )}
                    </div>
                    <p className="address-full-text">
                      {addr.address}، {addr.area}، {addr.city}
                    </p>
                    {addr.building && (
                      <p className="address-sub-details">
                        مبنى: {addr.building}
                        {addr.floor ? ` - دور: ${addr.floor}` : ''}
                        {addr.apartment ? ` - شقة: ${addr.apartment}` : ''}
                      </p>
                    )}
                    {addr.delivery_notes && (
                      <p className="address-notes-preview">
                        ملاحظة: {addr.delivery_notes}
                      </p>
                    )}
                  </div>
                ))
              )}

              <button
                type="button"
                className="btn btn-outline add-new-address-btn"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus size={16} />
                <span>إضافة عنوان جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
