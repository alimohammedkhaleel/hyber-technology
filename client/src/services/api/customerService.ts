import { apiClient } from './client';
import { CustomerProfile, CustomerAddress } from '../../types';

export const customerService = {
  async getProfile(): Promise<{ profile: CustomerProfile; addresses: CustomerAddress[] }> {
    const res = await apiClient.get<{ profile: CustomerProfile; addresses: CustomerAddress[] }>('/customers/profile');
    return res.data?.data || { profile: {} as CustomerProfile, addresses: [] };
  },

  async getAddresses(): Promise<CustomerAddress[]> {
    const res = await this.getProfile();
    return res.addresses || [];
  },

  async updateProfile(data: { fullName?: string; phone?: string; email?: string }): Promise<CustomerProfile> {
    const res = await apiClient.put<{ profile: CustomerProfile }>('/customers/profile', data);
    return res.data?.data?.profile as CustomerProfile;
  },

  async addAddress(data: {
    label?: string;
    address: string;
    area?: string;
    city?: string;
    deliveryNotes?: string;
    isDefault?: boolean;
    is_default?: boolean;
    [key: string]: any;
  }): Promise<CustomerAddress> {
    const payload = {
      label: data.label || 'المنزل',
      address: data.address,
      area: data.area || 'السويس',
      city: data.city || 'السويس',
      deliveryNotes: data.deliveryNotes || data.delivery_notes,
      isDefault: data.isDefault ?? data.is_default ?? true,
    };
    const res = await apiClient.post<{ address: CustomerAddress }>('/customers/addresses', payload);
    return res.data?.data?.address as CustomerAddress;
  },

  async createAddress(data: {
    label?: string;
    address: string;
    area?: string;
    city?: string;
    deliveryNotes?: string;
    isDefault?: boolean;
    [key: string]: any;
  }): Promise<CustomerAddress> {
    return this.addAddress(data);
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/customers/addresses/${id}`);
  },
};
