import { apiClient } from './client';
import { ExchangeRateRecord } from '../../types';

export const exchangeRateService = {
  async getCurrentRate(): Promise<{ rate: number; metadata: ExchangeRateRecord }> {
    const res = await apiClient.get('/exchange-rate/current');
    return res.data?.data || { rate: 48.50, metadata: null };
  },

  async getHistory(limit: number = 30): Promise<ExchangeRateRecord[]> {
    const res = await apiClient.get('/exchange-rate/history', { params: { limit } });
    return res.data?.data?.history || [];
  },

  async overrideRate(rate: number, notes?: string): Promise<ExchangeRateRecord> {
    const res = await apiClient.post('/exchange-rate/override', { rate, notes });
    return res.data?.data?.record;
  },

  async getRateHistory(limit: number = 30): Promise<ExchangeRateRecord[]> {
    return this.getHistory(limit);
  },

  async setManualRate(rate: number, notes?: string): Promise<ExchangeRateRecord> {
    return this.overrideRate(rate, notes);
  },

  async syncDailyRate(): Promise<{ success: boolean; rate?: number; message: string }> {
    const res = await apiClient.post('/exchange-rate/sync');
    return res.data?.data;
  },
};
