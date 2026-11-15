import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import type { CartResponse } from '../types/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartResponse | null;
  cartCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    setLoading(true);
    try {
      const updatedCart = await cartService.addToCart({ productId, quantity });
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setLoading(true);
    try {
      const updatedCart = await cartService.updateCartItem(productId, { quantity });
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setLoading(true);
    try {
      const updatedCart = await cartService.removeCartItem(productId);
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const updatedCart = await cartService.clearCart();
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cart ? cart.totalQuantity : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
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
