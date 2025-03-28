import axios from "axios";

const API_URL = "http://localhost:5000";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove the token interceptor since we'll rely on cookies

// ✅ Interface untuk data yang digunakan di API
interface Credentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// ✅ Tambahkan error handling di setiap request
export const authAPI = {
  register: async (userData: RegisterData) => {
    try {
      const response = await api.post("/api/v1/users/register", userData);
      return response.data;
    } catch (error) {
      console.error("Register Error:", error);
      throw error;
    }
  },
  login: async (credentials: Credentials) => {
    try {
      const response = await api.post("/api/v1/users/login", credentials);
      console.log("Response Login:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },
  logout: async () => {
    try {
      const response = await api.post("/api/v1/users/logout");
      return response.data;
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  },
  getProfile: async () => {
    try {
      const response = await api.get("/api/v1/users/profile");
      console.log("Response Profile:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn("Unauthorized: Redirecting to login...");
        // Bisa tambahkan logika logout atau redirect
      }
      console.error("Get Profile Error:", error);
      throw error;
    }
  },
};

// Rest of the code remains the same (booksAPI, categoriesAPI, cartAPI, ordersAPI)
export const booksAPI = {
  getAllBooks: async () => {
    try {
      const response = await api.get("/api/v1/books");
      return response.data;
    } catch (error) {
      console.error("Get Books Error:", error);
      throw error;
    }
  },
  getBookById: async (id: string) => {
    try {
      const response = await api.get(`/api/v1/books/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get Book By ID Error:", error);
      throw error;
    }
  },
  searchBooks: async (query: string) => {
    try {
      const response = await api.get(`/api/v1/books/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Search Books Error:", error);
      throw error;
    }
  },
};

export const categoriesAPI = {
  getAllCategories: async () => {
    try {
      const response = await api.get("/api/v1/categories");
      return response.data;
    } catch (error) {
      console.error("Get Categories Error:", error);
      throw error;
    }
  },
  getCategoryById: async (id: string) => {
    try {
      const response = await api.get(`/api/v1/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get Category By ID Error:", error);
      throw error;
    }
  },
};

export const cartAPI = {
  getCartItems: async () => {
    try {
      const response = await api.get("/api/v1/carts");
      return response.data;
    } catch (error) {
      console.error("Get Cart Items Error:", error);
      throw error;
    }
  },
  addToCart: async (bookId: string, quantity: number) => {
    try {
      const response = await api.post("/api/v1/carts", { bookId, quantity });
      return response.data;
    } catch (error) {
      console.error("Add To Cart Error:", error);
      throw error;
    }
  },
  updateCartItem: async (id: string, quantity: number) => {
    try {
      const response = await api.put(`/api/v1/carts/${id}`, { quantity });
      return response.data;
    } catch (error) {
      console.error("Update Cart Item Error:", error);
      throw error;
    }
  },
  removeFromCart: async (id: string) => {
    try {
      const response = await api.delete(`/api/v1/carts/${id}`);
      return response.data;
    } catch (error) {
      console.error("Remove From Cart Error:", error);
      throw error;
    }
  },
};

export const ordersAPI = {
  getOrders: async () => {
    try {
      const response = await api.get("/api/v1/orders");
      return response.data;
    } catch (error) {
      console.error("Get Orders Error:", error);
      throw error;
    }
  },
  getOrderById: async (id: string) => {
    try {
      const response = await api.get(`/api/v1/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get Order By ID Error:", error);
      throw error;
    }
  },
  createOrder: async (orderData: any) => {
    try {
      const response = await api.post("/api/v1/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("Create Order Error:", error);
      throw error;
    }
  },
};