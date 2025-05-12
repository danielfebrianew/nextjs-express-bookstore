"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { booksAPI } from "@/lib/api";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast"; 
import { useAuthStore } from "@/lib/stores/auth-store";

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl: string;
  description: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
}

export default function BookDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [isLoggedIn] = useState(!!user); // Check if user is logged in
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addToCart  = useCartStore((state) => state.addToCart);
  const [isAdding, setIsAdding] = useState(false); 

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const bookData = await booksAPI.getBookById(id as string);
        
        setBook(bookData);
      } catch (err) {
        setError("Failed to load book details. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.error('Havent logged in yet.');
      return;
    }
    
    if (!book) return;
    if (quantity < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(book.id, quantity);
      toast.success(`${book.title} added to cart!`);
      setQuantity(1); // Reset jumlah setelah berhasil
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add item. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || "Book not found"}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Book Image */}
        <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden">
          <Image
            src={book.imageUrl || "/placeholder-book.jpg"}
            alt={book.title}
            fill
            className="object-contain"
          />
        </div>

        {/* Book Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

          {book.category && (
            <div className="mb-4">
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {book.category.name}
              </span>
            </div>
          )}

          <div className="text-2xl font-bold mb-6">{formatPrice(book.price)}</div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{book.description}</p>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20">
              <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isAdding} // Disable tombol saat proses add to cart
              className="mt-auto"
            >
              {isAdding ? "Adding..." : "Add to Cart"} {/* Ganti teks saat loading */}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
