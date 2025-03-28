"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cartAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Cart() {
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const response = await cartAPI.getCartItems();
        console.log("Full response:", response);

        if (Array.isArray(response)) {
          setCartItems(response.map((item: any) => ({
            id: item.id,
            title: item.book.title,
            price: item.book.price,
            image: item.book.imageUrl || "https://placehold.co/80x80.png",
            quantity: item.quantity,
          })));
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchCart();
  }, [user]);

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
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await cartAPI.updateCartItem(id, quantity);
      setCartItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const getTotalPrice = () => {
    return cartItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal satu item untuk checkout!");
      return;
    }

    toast.success("Redirecting to checkout...");
    router.push("/checkout");
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Your Cart</h1>

        {isLoading ? (
          <p className="text-white">Loading...</p>
        ) : cartItems.length === 0 ? (
          <p className="text-white">
            Keranjang Anda masih kosong.{" "}
            <Link href="/" className="text-blue-400">
              Lanjutkan belanja
            </Link>
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
                    src={item.image}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <h2 className="text-white text-lg font-semibold">{item.title}</h2>
                    <p className="text-white font-bold">
                      Rp {item.price.toLocaleString("id-ID")},00 x {item.quantity}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-600 text-white px-2 rounded"
                      >
                        -
                      </button>
                      <span className="text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-600 text-white px-2 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            <div className="text-right text-white text-xl font-bold">
              Total: Rp {getTotalPrice().toLocaleString("id-ID")},00
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
