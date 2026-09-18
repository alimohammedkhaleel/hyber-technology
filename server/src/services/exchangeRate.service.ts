import { query } from '../config/database';
import { logger } from '../utils/logger.util';
import { auditService } from './audit.service';

export interface ExchangeRateRecord {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_at: string;
  source: string;
  is_manual_override: boolean;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export class ExchangeRateService {
  private fallbackRate = 48.50;
  private cachedRate: number | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds

  /**
   * Retrieves the current effective USD to EGP exchange rate with in-memory caching.
   */
  async getCurrentRate(): Promise<number> {
    const now = Date.now();
    if (this.cachedRate !== null && now < this.cacheExpiry) {
      return this.cachedRate;
    }

    try {
      const res = await query<ExchangeRateRecord>(
        `SELECT rate FROM exchange_rates
         WHERE from_currency = 'USD' AND to_currency = 'EGP'
         ORDER BY effective_at DESC, id DESC
         LIMIT 1`
      );

      if (res.rows.length > 0) {
        const rate = Number(res.rows[0].rate);
        this.cachedRate = rate;
        this.cacheExpiry = now + this.CACHE_TTL_MS;
        return rate;
      }

      // Seed fallback rate if database table is completely empty
      await this.recordRate({
        rate: this.fallbackRate,
        source: 'INITIAL_BOOTSTRAP',
        isManualOverride: false,
        notes: 'سعر الصرف الافتراضي الأولي',
      });

      this.cachedRate = this.fallbackRate;
      this.cacheExpiry = now + this.CACHE_TTL_MS;
      return this.fallbackRate;
    } catch (err: any) {
      logger.error('Failed to retrieve exchange rate from DB, using fallback baseline', { error: err.message });
      return this.fallbackRate;
    }
  }

  /**
   * Clears the current in-memory exchange rate cache.
   */
  clearCache(): void {
    this.cachedRate = null;
    this.cacheExpiry = 0;
  }

  /**
   * Retrieves the latest rate record with full metadata.
   */
  async getLatestRateRecord(): Promise<ExchangeRateRecord | null> {
    const res = await query<ExchangeRateRecord>(
      `SELECT * FROM exchange_rates
       WHERE from_currency = 'USD' AND to_currency = 'EGP'
       ORDER BY effective_at DESC, id DESC
       LIMIT 1`
    );
    return res.rows[0] || null;
  }

  /**
   * Retrieves rate history with pagination.
   */
  async getRateHistory(limit: number = 30): Promise<ExchangeRateRecord[]> {
    const res = await query<ExchangeRateRecord>(
      `SELECT er.*, u.phone AS changed_by_phone
       FROM exchange_rates er
       LEFT JOIN users u ON u.id = er.changed_by
       WHERE er.from_currency = 'USD' AND er.to_currency = 'EGP'
       ORDER BY er.effective_at DESC, er.id DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  /**
   * Admin manual override for the USD/EGP exchange rate.
   */
  async setManualRate(rate: number, adminUserId: string, notes?: string): Promise<ExchangeRateRecord> {
    if (isNaN(rate) || rate <= 0 || rate > 500) {
      throw new Error('قيمة سعر الصرف المدخلة غير صالحة. يجب أن تكون رقماً موجباً منطقياً.');
    }

    const previousRate = await this.getCurrentRate();

    const newRecord = await this.recordRate({
      rate,
      source: 'ADMIN_MANUAL_OVERRIDE',
      isManualOverride: true,
      changedBy: adminUserId,
      notes: notes || 'تعديل يدوي من لوحة تحكم الإدارة',
    });

    this.clearCache();

    await auditService.log({
      actorId: adminUserId,
      action: 'EXCHANGE_RATE_MANUAL_OVERRIDE',
      entityType: 'EXCHANGE_RATE',
      entityId: String(newRecord.id),
      metadata: {
        previousRate,
        newRate: rate,
        notes,
      },
    });

    logger.info(`USD/EGP exchange rate manually updated to ${rate} by admin ${adminUserId}`);
    return newRecord;
  }

  /**
   * Automated rate synchronization from configured external source.
   */
  async syncDailyRate(): Promise<{ success: boolean; rate?: number; message: string }> {
    const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();
      const fetchedRate = data?.rates?.EGP;

      // Sanity checks: must be a positive number in a realistic range
      if (typeof fetchedRate !== 'number' || fetchedRate < 10 || fetchedRate > 300) {
        throw new Error(`Invalid rate value received from provider: ${fetchedRate}`);
      }

      const previousRate = await this.getCurrentRate();
      const difference = Math.abs(fetchedRate - previousRate);

      // Record new daily automated rate
      await this.recordRate({
        rate: fetchedRate,
        source: 'AUTOMATED_DAILY_PROVIDER',
        isManualOverride: false,
        notes: `تحديث تلقائي يومي - الفارق: ${difference.toFixed(2)} ج.م`,
      });

      this.clearCache();

      logger.info(`Automated exchange rate synced successfully: USD 1 = EGP ${fetchedRate}`);
      return {
        success: true,
        rate: fetchedRate,
        message: `تم تحديث سعر الصرف تلقائياً بنجاح: 1 دولار = ${fetchedRate.toFixed(2)} ج.م`,
      };
    } catch (err: any) {
      logger.warn('Automated exchange rate sync failed, keeping current rate intact', { error: err.message });
      return {
        success: false,
        message: `تعذر الاتصال بمزود سعر الصرف الخارجي (${err.message}). تم الإبقاء على آخر سعر معتمد.`,
      };
    }
  }

  private async recordRate(params: {
    rate: number;
    source: string;
    isManualOverride: boolean;
    changedBy?: string;
    notes?: string;
  }): Promise<ExchangeRateRecord> {
    const res = await query<ExchangeRateRecord>(
      `INSERT INTO exchange_rates (
         from_currency, to_currency, rate, source, is_manual_override, changed_by, notes, effective_at
       ) VALUES ('USD', 'EGP', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [params.rate, params.source, params.isManualOverride, params.changedBy || null, params.notes || null]
    );
    return res.rows[0];
  }
}

export const exchangeRateService = new ExchangeRateService();
