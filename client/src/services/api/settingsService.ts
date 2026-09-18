import { apiClient } from './client';
import { StoreSettings } from '../../types';

export const settingsService = {
  async getSettings(): Promise<StoreSettings> {
    const res = await apiClient.get('/settings');
    return res.data?.data?.settings;
  },
};
