import { apiClient } from './client';
import { Cart } from '../../types';

export const cartService = {
  async getCart(): Promise<{ cart: Cart }> {
    const res = await apiClient.get('/cart');
    return res.data?.data || { cart: { id: '', items: [], subtotal: 0, total: 0, itemCount: 0 } };
  },

  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    await apiClient.post('/cart/items', { productId, quantity });
  },

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    await apiClient.patch(`/cart/items/${itemId}`, { quantity });
  },

  async removeItem(itemId: string): Promise<void> {
    await apiClient.delete(`/cart/items/${itemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/cart/clear');
  },
};
