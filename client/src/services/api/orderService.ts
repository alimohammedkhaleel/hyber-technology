import { apiClient } from './client';
import { Order, PaymentMethod } from '../../types';

export const orderService = {
  async createOrder(data: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    notes?: string;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    payerPhone?: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<Order> {
    const res = await apiClient.post('/orders', data);
    return res.data?.data?.order;
  },

  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get('/orders');
    return res.data?.data?.orders || [];
  },

  async getOrderById(orderId: string): Promise<Order> {
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data?.data?.order;
  },

  async submitPaymentProof(orderId: string, data: {
    paymentReference: string;
    payerPhone?: string;
    paymentProofUrl?: string;
  }): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/payment-proof`, data);
    return res.data?.data?.order;
  },
};
