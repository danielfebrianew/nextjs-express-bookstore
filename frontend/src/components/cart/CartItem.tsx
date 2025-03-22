import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    book: {
      id: string;
      title: string;
      author: string;
      price: number;
      coverImage: string;
    };
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart, loading } = useCart();

  const handleQuantityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      await updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = async () => {
    await removeFromCart(item.id);
  };

  return (
    <div className="flex items-center space-x-4 py-4 border-b">
      <div className="relative h-20 w-16 flex-shrink-0">
        {item.book.coverImage ? (
          <Image
            src={item.book.coverImage}
            alt={item.book.title}
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src="https://placehold.co/400x500"
            alt="Placeholder"
            fill
            className="object-cover"
          />
        )}
      </div>
      
      <div className="flex-grow">
        <Link href={`/books/${item.book.id}`} className="font-medium hover:underline">
          {item.book.title}
        </Link>
        <p className="text-sm text-gray-500">{item.book.author}</p>
        <p className="font-bold mt-1">{formatPrice(item.book.price)}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-20">
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
            disabled={loading}
            className="h-8"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemove}
          disabled={loading}
          className="h-8 px-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}