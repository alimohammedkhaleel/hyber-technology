import { query } from '../config/database';
import { auditService } from './audit.service';

export interface GovernorateShippingRate {
  id: string;
  nameAr: string;
  fee: number;
}

export const DEFAULT_SHIPPING_RATES: GovernorateShippingRate[] = [
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

export interface StoreSettingsEntity {
  id: number;
  store_name_ar: string;
  store_name_en: string;
  supervisor_name_ar: string;
  phone: string;
  address_ar: string;
  working_hours_ar: string;
  cod_enabled: boolean;
  instapay_enabled: boolean;
  instapay_info: string;
  vodafone_cash_enabled: boolean;
  vodafone_cash_info: string;
  usd_egp_rate_auto_update: boolean;
  shipping_rates?: GovernorateShippingRate[];
  updated_at: string;
}

export class SettingsService {
  private cachedSettings: StoreSettingsEntity | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 120 * 1000; // 120 seconds

  async getSettings(): Promise<StoreSettingsEntity> {
    const now = Date.now();
    if (this.cachedSettings !== null && now < this.cacheExpiry) {
      return this.cachedSettings;
    }

    const res = await query<StoreSettingsEntity>('SELECT * FROM store_settings WHERE id = 1');
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (!row.shipping_rates || !Array.isArray(row.shipping_rates) || row.shipping_rates.length === 0) {
        row.shipping_rates = DEFAULT_SHIPPING_RATES;
      }
      this.cachedSettings = row;
      this.cacheExpiry = now + this.CACHE_TTL_MS;
      return row;
    }

    // Default fallback
    const fallback: StoreSettingsEntity = {
      id: 1,
      store_name_ar: 'متجر هايبر تكنولوجي',
      store_name_en: 'Hyper Technology Store',
      supervisor_name_ar: 'باش مهندس أحمد السيد',
      phone: '01017719898',
      address_ar: 'السويس - السلام 1، موجود مباشرة أمام أسواق رمضان، شارع المعهد الهندسي، وخلف صيدلية محمد علي',
      working_hours_ar: 'يومياً من 10:00 صباحاً حتى 11:00 مساءً',
      cod_enabled: true,
      instapay_enabled: true,
      instapay_info: 'يرجى تحويل إجمالي المبلغ عبر تطبيق InstaPay إلى المعرف 01017719898@instapay أو رقم الهاتف 01017719898 ثم تسجيل الرقم المرجعي للعملية أدناه.',
      vodafone_cash_enabled: true,
      vodafone_cash_info: 'يرجى تحويل المبلغ عبر فودافون كاش إلى الرقم: 01017719898 ثم إدخال رقم المعاملة ورقم المحفظة التي قمت بالتحويل منها.',
      usd_egp_rate_auto_update: true,
      shipping_rates: DEFAULT_SHIPPING_RATES,
      updated_at: new Date().toISOString(),
    };
    this.cachedSettings = fallback;
    this.cacheExpiry = now + this.CACHE_TTL_MS;
    return fallback;
  }

  clearCache(): void {
    this.cachedSettings = null;
    this.cacheExpiry = 0;
  }

  async updateSettings(data: Partial<StoreSettingsEntity>, adminUserId?: string): Promise<StoreSettingsEntity> {
    const shippingRatesJson = data.shipping_rates ? JSON.stringify(data.shipping_rates) : null;

    const res = await query<StoreSettingsEntity>(
      `UPDATE store_settings SET
        store_name_ar = COALESCE($1, store_name_ar),
        store_name_en = COALESCE($2, store_name_en),
        supervisor_name_ar = COALESCE($3, supervisor_name_ar),
        phone = COALESCE($4, phone),
        address_ar = COALESCE($5, address_ar),
        working_hours_ar = COALESCE($6, working_hours_ar),
        cod_enabled = COALESCE($7, cod_enabled),
        instapay_enabled = COALESCE($8, instapay_enabled),
        instapay_info = COALESCE($9, instapay_info),
        vodafone_cash_enabled = COALESCE($10, vodafone_cash_enabled),
        vodafone_cash_info = COALESCE($11, vodafone_cash_info),
        usd_egp_rate_auto_update = COALESCE($12, usd_egp_rate_auto_update),
        shipping_rates = COALESCE($13::jsonb, shipping_rates),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *`,
      [
        data.store_name_ar,
        data.store_name_en,
        data.supervisor_name_ar,
        data.phone,
        data.address_ar,
        data.working_hours_ar,
        data.cod_enabled,
        data.instapay_enabled,
        data.instapay_info,
        data.vodafone_cash_enabled,
        data.vodafone_cash_info,
        data.usd_egp_rate_auto_update,
        shippingRatesJson,
      ]
    );

    const updated = res.rows[0];
    this.clearCache();

    if (adminUserId) {
      await auditService.log({
        actorId: adminUserId,
        action: 'STORE_SETTINGS_UPDATED',
        entityType: 'STORE_SETTINGS',
        entityId: '1',
        metadata: {
          cod_enabled: updated.cod_enabled,
          instapay_enabled: updated.instapay_enabled,
          vodafone_cash_enabled: updated.vodafone_cash_enabled,
          shipping_rates_updated: Boolean(data.shipping_rates),
        },
      });
    }

    return updated;
  }
}

export const settingsService = new SettingsService();

