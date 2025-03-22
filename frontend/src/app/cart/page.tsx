"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { cartAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const Cart: React.FC = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (!user) return; // ⬅️ Jika user belum login, jangan fetch
        const cartData = await cartAPI.getCartItems();
        setCartItems(cartData.data.items);
        setCartItems(cartData.items);
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
      }
    };

    fetchCart();
  }, []);

  const handleCheckboxChange = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
    setSelectAll(!selectAll);
  };

  const removeFromCart = async (id: string) => {
    try {
      await cartAPI.removeFromCart(id);
      setCartItems(cartItems.filter((item) => item.id !== id));
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await cartAPI.updateCartItem(id, quantity);
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const getTotalPrice = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 mt-30">
        <h1 className="text-3xl font-bold text-white mb-4">Your Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-white">
            Your cart is empty. <Link href="/" className="text-blue-400">Continue shopping</Link>
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-5 h-5 text-blue-500"
              />
              <label className="text-white text-lg font-semibold">Pilih Semua</label>
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="bg-[#282830] p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleCheckboxChange(item.id)}
                    className="w-5 h-5 text-blue-500"
                  />

                  <Image
                    src={item.image || "https://placehold.co/80x80.png"}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <h2 className="text-white text-lg font-semibold">{item.name}</h2>
                    <p className="text-white font-bold">Rp {item.price.toLocaleString("id-ID")},00 x {item.quantity}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="bg-gray-600 text-white px-2 rounded">-</button>
                      <span className="text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="bg-gray-600 text-white px-2 rounded">+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-600 transition">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            <div className="text-right text-white text-xl font-bold">
              Total: Rp {getTotalPrice().toLocaleString("id-ID")},00
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
function getAuthToken() {
  throw new Error("Function not implemented.");
}

