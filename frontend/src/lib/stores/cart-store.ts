import { create } from "zustand";
import { cartAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth-store";

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

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  fetchCartItems: () => Promise<void>;
  addToCart: (bookId: string, quantity: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchCartItems: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ items: [] });
      return;
    }

    try {
      set({ loading: true });
      const cartItems = await cartAPI.getCartItems();
      set({ items: cartItems });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to fetch cart items" });
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (bookId, quantity) => {
    try {
      set({ loading: true });
      await cartAPI.addToCart(bookId, quantity);
      await get().fetchCartItems();
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to add item to cart" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateQuantity: async (id, quantity) => {
    try {
      set({ loading: true });
      await cartAPI.updateCartItem(id, quantity);
      await get().fetchCartItems();
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to update cart item" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  removeFromCart: async (id) => {
    try {
      set({ loading: true });
      await cartAPI.removeFromCart(id);
      await get().fetchCartItems();
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to remove item from cart" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  clearCart: () => {
    set({ items: [] });
  },

  // Total items & price sebagai computed values:
  get totalItems() {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  get totalPrice() {
    return get().items.reduce((total, item) => total + item.quantity * item.book.price, 0);
  },
}));
