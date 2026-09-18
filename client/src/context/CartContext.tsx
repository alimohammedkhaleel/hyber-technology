import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/api/cartService';
import { Cart, CartItem, Product } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Sync / Load Cart
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setIsLoading(true);
        const data = await cartService.getCart();
        setCart(data.cart);
        setLocalItems(data.cart?.items || []);
      } catch (err) {
        console.error('Failed to fetch remote cart, using local state:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest local storage cart
      try {
        const saved = localStorage.getItem('hts_guest_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLocalItems(parsed);
        }
      } catch (e) {
        setLocalItems([]);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Persist guest cart locally
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('hts_guest_cart', JSON.stringify(localItems));
    }
  }, [localItems, isAuthenticated]);

  const addToCart = async (product: Product, quantity: number = 1): Promise<boolean> => {
    const unitPrice = product.pricing?.sellingPriceEgp || product.manual_egp_price || 0;

    if (isAuthenticated) {
      try {
        setIsLoading(true);
        await cartService.addToCart(product.id, quantity);
        await refreshCart();
        setIsDrawerOpen(true);
        return true;
      } catch (err: any) {
        console.error('Error adding to cart:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest cart local logic
      setLocalItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId === product.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          const newQty = updated[existingIdx].quantity + quantity;
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: newQty,
            totalPrice: unitPrice * newQty,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `guest-item-${Date.now()}-${Math.random()}`,
              productId: product.id,
              nameAr: product.name_ar,
              nameEn: product.name_en,
              sku: product.sku,
              imageUrl: product.image_url,
              stockQuantity: product.stock_quantity,
              isAvailable: product.is_available && product.stock_quantity > 0,
              quantity,
              unitPrice,
              totalPrice: unitPrice * quantity,
              pricing: product.pricing,
            },
          ];
        }
      });
      setIsDrawerOpen(true);
      return true;
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    if (isAuthenticated) {
      try {
        await cartService.updateQuantity(itemId, newQuantity);
        await refreshCart();
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    } else {
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
            : item
        )
      );
    }
  };

  const removeItem = async (itemId: string) => {
    if (isAuthenticated) {
      try {
        await cartService.removeItem(itemId);
        await refreshCart();
      } catch (err) {
        console.error('Error removing cart item:', err);
      }
    } else {
      setLocalItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
        setCart(null);
        setLocalItems([]);
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    } else {
      setLocalItems([]);
      localStorage.removeItem('hts_guest_cart');
    }
  };

  const items = isAuthenticated && cart ? cart.items : localItems;
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart: cart || { id: 'guest', items, subtotal, total: subtotal, itemCount },
        items,
        itemCount,
        subtotal,
        total: subtotal,
        isLoading,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
