import { apiClient } from './client';
import {
  AdminMetrics,
  Product,
  Category,
  CarouselSlide,
  Order,
  StoreSettings,
  CustomerProfile,
  AuditLog,
  OrderStatus,
} from '../../types';

export const adminService = {
  // Overview
  async getOverview(): Promise<{ metrics: AdminMetrics }> {
    const res = await apiClient.get('/admin/overview');
    return res.data?.data;
  },

  // Products
  async getProducts(params?: { categoryId?: string; search?: string; limit?: number; offset?: number }): Promise<{ products: Product[]; total: number }> {
    const res = await apiClient.get('/admin/products', { params });
    return res.data?.data || { products: [], total: 0 };
  },

  async getProduct(id: string): Promise<Product> {
    const res = await apiClient.get(`/admin/products/${id}`);
    return res.data?.data?.product;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await apiClient.post('/admin/products', data);
    return res.data?.data?.product;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const res = await apiClient.put(`/admin/products/${id}`, data);
    return res.data?.data?.product;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get('/admin/categories');
    return res.data?.data?.categories || [];
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await apiClient.post('/admin/categories', data);
    return res.data?.data?.category;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await apiClient.put(`/admin/categories/${id}`, data);
    return res.data?.data?.category;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  // Carousel
  async getCarouselSlides(): Promise<CarouselSlide[]> {
    const res = await apiClient.get('/admin/carousel');
    return res.data?.data?.slides || [];
  },

  async createCarouselSlide(data: Partial<CarouselSlide>): Promise<CarouselSlide> {
    const res = await apiClient.post('/admin/carousel', data);
    return res.data?.data?.slide;
  },

  async updateCarouselSlide(id: string, data: Partial<CarouselSlide>): Promise<CarouselSlide> {
    const res = await apiClient.put(`/admin/carousel/${id}`, data);
    return res.data?.data?.slide;
  },

  async deleteCarouselSlide(id: string): Promise<void> {
    await apiClient.delete(`/admin/carousel/${id}`);
  },

  // Orders & Payment Verification
  async getOrders(params?: { status?: string; paymentStatus?: string; search?: string }): Promise<{ orders: Order[]; total: number }> {
    const res = await apiClient.get('/admin/orders', { params });
    return res.data?.data || { orders: [], total: 0 };
  },

  async getOrder(id: string): Promise<Order> {
    const res = await apiClient.get(`/admin/orders/${id}`);
    return res.data?.data?.order;
  },

  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<Order> {
    const res = await apiClient.patch(`/admin/orders/${id}/status`, { status, notes });
    return res.data?.data?.order;
  },

  async verifyPayment(id: string, action: 'CONFIRM' | 'REJECT' | 'REQUEST_CORRECTION', notes?: string): Promise<Order> {
    const res = await apiClient.post(`/admin/orders/${id}/verify-payment`, { action, notes });
    return res.data?.data?.order;
  },

  // Store Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await apiClient.get('/admin/settings');
    return res.data?.data?.settings;
  },

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await apiClient.put('/admin/settings', data);
    return res.data?.data?.settings;
  },

  // Customers
  async getCustomers(params?: { search?: string; period?: string }): Promise<CustomerProfile[]> {
    const res = await apiClient.get('/admin/customers', { params });
    return res.data?.data?.customers || [];
  },

  // Audit Logs
  async getAuditLogs(params?: { action?: string; limit?: number }): Promise<AuditLog[]> {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data?.data?.logs || [];
  },

  async deleteAuditLog(id: number | string): Promise<void> {
    await apiClient.delete(`/admin/audit-logs/${id}`);
  },

  async deleteAllAuditLogs(): Promise<{ deletedCount: number }> {
    const res = await apiClient.delete('/admin/audit-logs');
    return res.data?.data;
  },
};

