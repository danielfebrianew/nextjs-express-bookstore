"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cartAPI } from "./api";
import { useAuth } from "./auth-context";

interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    coverImage: string;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (bookId: string, quantity: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCartItems = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const cartItems = await cartAPI.getCartItems();
      setItems(cartItems);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch cart items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  const addToCart = async (bookId: string, quantity: number) => {
    try {
      setLoading(true);
      await cartAPI.addToCart(bookId, quantity);
      await fetchCartItems();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add item to cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      setLoading(true);
      await cartAPI.updateCartItem(id, quantity);
      await fetchCartItems();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update cart item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      setLoading(true);
      await cartAPI.removeFromCart(id);
      await fetchCartItems();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove item from cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const totalPrice = items.reduce(
    (total, item) => total + item.quantity * item.book.price,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
} 