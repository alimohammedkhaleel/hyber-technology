import React from 'react';
import { BRANDING } from '../../../config/branding';
import logoImg from '../../../assets/images/logo/logo.png'; // HTS Official Logo
import {
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CreditCard,
  Tv,
  Camera,
  Wifi,
  Mail,
} from 'lucide-react';
import './Footer.css';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="hts-footer">
      <div className="hts-container footer-inner">
        {/* Main Columns Grid */}
        <div className="footer-columns-grid">
          {/* Col 1: Brand & Supervisor */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="footer-logo-wrap">
                <img src={logoImg} alt={BRANDING.nameAr} className="footer-logo" />
              </div>
              <div>
                <h3 className="footer-brand-title">{BRANDING.nameAr}</h3>
                <span className="footer-brand-subtitle">{BRANDING.nameEn}</span>
              </div>
            </div>

            <div className="footer-supervisor-pill">
              <ShieldCheck size={16} className="gold-text" />
              <span>{BRANDING.supervisorAr}</span>
            </div>

            <p className="footer-about-text">
              المتجر المتكامل لتوفير جميع مستلزمات الإلكترونيات، أحدث شاشات التلفزيون، أنظمة كاميرات المراقبة، أجهزة التسجيل، وحلول الشبكات والتجهيزات الكهربائية بأعلى معايير الجودة وضمان هندسي معتمد مع الشحن والتوصيل لكافة محافظات مصر.
            </p>
          </div>

          {/* Col 2: Categories */}
          <div className="footer-col links-col">
            <h4 className="footer-heading">أقسام المنتجات</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => onNavigate('/products')}>
                  <span>جميع المنتجات والمستلزمات</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/products?categorySlug=screens-tvs')}>
                  <span>الشاشات والتلفزيونات</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/products?categorySlug=security-cameras')}>
                  <span>كاميرات المراقبة وأنظمة الأمان</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/products?categorySlug=dvr-nvr-systems')}>
                  <span>أجهزة التسجيل DVR & NVR</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/products?categorySlug=networking-routers')}>
                  <span>الراوترات والشبكات</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/products?categorySlug=cables-power')}>
                  <span>الكابلات ومزودات الطاقة والمستلزمات</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Location & Contact Information */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">المعرض الرئيسي والتواصل</h4>
            <ul className="footer-contact-list">
              <li className="contact-item">
                <div className="contact-icon-circle">
                  <MapPin size={18} />
                </div>
                <div>
                  <strong>موقع المعرض:</strong>
                  <a
                    href={BRANDING.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-footer-link"
                    title="فتح الموقع على خرائط جوجل"
                  >
                    {BRANDING.address}
                  </a>
                </div>
              </li>

              <li className="contact-item">
                <div className="contact-icon-circle">
                  <Phone size={18} />
                </div>
                <div>
                  <strong>واتساب والاستفسارات:</strong>
                  <a
                    href="https://wa.me/201017719898"
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="phone-text whatsapp-link"
                  >
                    {BRANDING.supportPhone} (واتساب مباشر)
                  </a>
                </div>
              </li>

              <li className="contact-item">
                <div className="contact-icon-circle">
                  <Clock size={18} />
                </div>
                <div>
                  <strong>مواعيد العمل:</strong>
                  <p>يومياً من 10:00 صباحاً حتى 11:00 مساءً</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Methods */}
          <div className="footer-col payment-col">
            <h4 className="footer-heading">طرق الدفع المعتمدة</h4>
            <p className="payment-desc">
              نوفر خيارات دفع آمنة ومريحة لعملائنا في السويس وجميع المحافظات:
            </p>

            <div className="payment-badges-grid">
              <div className="payment-badge-card">
                <div className="badge-icon-box">
                  <CreditCard size={18} />
                </div>
                <div>
                  <strong>الدفع عند الاستلام</strong>
                  <span>Cash on Delivery</span>
                </div>
              </div>

              <div className="payment-badge-card instapay-card">
                <div className="badge-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>إنستاباي InstaPay</strong>
                  <span>تحويل بنكي لحظي</span>
                </div>
              </div>

              <div className="payment-badge-card vodafone-card">
                <div className="badge-icon-box">
                  <Phone size={18} />
                </div>
                <div>
                  <strong>فودافون كاش</strong>
                  <span>تحويل عبر المحفظة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Attribution Credit Bar */}
        <div className="footer-developer-bar">
          <div className="developer-credit-box">
            <span>تم تطويره بكل حب بواسطة</span>
            <strong className="dev-name">باش مهندس علي محمد علي خليل</strong>
            <span className="dev-dot">•</span>
            <a href="https://wa.me/201121360605" target="_blank" rel="noopener noreferrer" dir="ltr" className="dev-phone-link">
              01121360605
            </a>
            <span className="dev-dot">•</span>
            <a
              href="https://www.tiktok.com/@zlolcoding"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-tiktok-link"
            >
              <span>تيك توك: @zlolcoding</span>
            </a>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">{BRANDING.copyright}</p>
          <div className="footer-credentials">
            <span>{BRANDING.nameEn} • Suez, Egypt</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
