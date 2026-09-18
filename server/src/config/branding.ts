/**
 * Centralized Branding Configuration (Server)
 * 
 * Hyper Technology Store - Specialized Electronics & Technology Store
 * Under the supervision of Eng. Ahmed El-Sayed (باش مهندس أحمد السيد)
 */
export const BRANDING = {
  id: 'hyper-technology-store',
  nameAr: 'متجر هايبر تكنولوجي',
  nameEn: 'Hyper Technology Store',
  shortName: 'Hyper Technology',
  supervisorAr: 'تحت إشراف باش مهندس أحمد السيد',
  supervisorEn: 'Under the supervision of Eng. Ahmed El-Sayed',
  taglineAr: 'المتجر المتخصص في الشاشات، كاميرات المراقبة، التجهيزات الإلكترونية والشبكات',
  taglineEn: 'Specialized Electronics, Surveillance Systems, and Electrical Technology',
  supportEmail: 'info@hypertech-suez.com',
  supportPhone: '01017719898',
  address: 'السويس - السلام 1، موجود مباشرة أمام أسواق رمضان، شارع المعهد الهندسي، وخلف صيدلية محمد علي',
  city: 'السويس',
  version: '1.0.0',
  currency: 'EGP',
  defaultLanguage: 'ar',
  supportedLanguages: ['ar', 'en'],
  copyright: '© 2026 Hyper Technology Store. جميع الحقوق محفوظة.',
} as const;

export type BrandingConfig = typeof BRANDING;
