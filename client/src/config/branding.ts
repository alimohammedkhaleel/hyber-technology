/**
 * Centralized Branding Configuration (Client)
 * 
 * Hyper Technology Store - Specialized Electronics & Electrical Systems Store
 * Under the supervision of Eng. Ahmed El-Sayed (باش مهندس أحمد السيد)
 * Serving all Egyptian Governorates | Main Showroom: Suez
 */
export const BRANDING = {
  id: 'hyper-technology-store',
  nameAr: 'متجر هايبر تكنولوجي',
  nameEn: 'Hyper Technology Store',
  shortName: 'Hyper Technology',
  supervisorAr: 'تحت إشراف باش مهندس أحمد السيد',
  supervisorEn: 'Under the supervision of Eng. Ahmed El-Sayed',
  taglineAr: 'وجهتك المتكاملة لجميع مستلزمات الإلكترونيات والشاشات وكاميرات المراقبة والشبكات | شحن لكافة محافظات مصر',
  taglineEn: 'Your premier destination for all electronics supplies, screens, security cameras, and networking across Egypt',
  presentationTitle: 'هايبر تكنولوجي',
  presentationSubtitle: 'تحت إشراف باش مهندس أحمد السيد | شحن لجميع محافظات مصر',
  logoAlt: 'شعار متجر هايبر تكنولوجي',
  currency: 'ج.م',
  currencyCode: 'EGP',
  supportEmail: 'info@hypertech-suez.com',
  supportPhone: '01017719898',
  address: 'السويس - السلام 1، موجود مباشرة أمام أسواق رمضان، شارع المعهد الهندسي، وخلف صيدلية محمد علي',
  city: 'السويس',
  coverageAr: 'شحن وتوصيل فوري لجميع محافظات جمهورية مصر العربية',
  version: '1.0.0',
  copyright: '© 2026 متجر هايبر تكنولوجي (Hyper Technology Store). جميع الحقوق محفوظة.',
} as const;

export type BrandingConfig = typeof BRANDING;

