import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice, truncateText } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    imageUrl: string;
    description: string;
  };
}

export default function BookCard({ book }: BookCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
const loading = useCartStore((s) => s.loading);

  const handleAddToCart = async () => {
    try {
      await addToCart(book.id, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  return (
    <Link href={`/books/${book.id}`} className="block transform transition-transform hover:scale-105">
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">
            {truncateText(book.title, 50)}
          </CardTitle>
          <CardDescription>{book.author}</CardDescription>
        </CardHeader>
        <div className="relative h-64 w-full">
          {book.imageUrl ? (
            <Image
              src={book.imageUrl}
              alt={book.title}
              sizes="400px"
              fill
              className="object-contain"
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />
          ) : (
            <Image
              src="https://placehold.co/400x500"
              alt="Placeholder"
              fill
              className="object-contain"
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />
          )}
        </div>
        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-gray-600">
            {truncateText(book.description, 100)}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <p className="font-bold">{formatPrice(book.price)}</p>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            disabled={loading}
            size="sm"
          >
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}