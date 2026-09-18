import { apiClient } from './client';
import { Product, Category, Brand } from '../../types';

export const productService = {
  async getProducts(params: {
    categoryId?: string;
    categorySlug?: string;
    brandId?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Product[]> {
    const res = await apiClient.get<{ products: Product[]; total: number }>('/products', { params });
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    return data?.products || [];
  },

  async getProductById(id: string): Promise<Product> {
    const res = await apiClient.get<{ product: Product }>(`/products/${id}`);
    return res.data?.data?.product as Product;
  },

  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<{ categories: Category[] }>('/categories');
    return res.data?.data?.categories || [];
  },

  async getBrands(): Promise<Brand[]> {
    try {
      const res = await apiClient.get<{ brands: Brand[] }>('/products/brands');
      return res.data?.data?.brands || [];
    } catch {
      return [];
    }
  },
};
