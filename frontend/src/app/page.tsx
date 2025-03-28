"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { booksAPI, categoriesAPI } from "@/lib/api";
import BookCard from "@/components/books/BookCard";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  imageUrl: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [booksData, categoriesData] = await Promise.all([
          booksAPI.getAllBooks(),
          categoriesAPI.getAllCategories(),
        ]);
        
        console.log("booksData:", booksData); // Debugging
    
        // Ambil books dari key `results`
        setFeaturedBooks(booksData.results.slice(0, 4));
        setCategories(categoriesData);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };  

    fetchData();
  }, []);

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-primary/10 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to BookStore</h1>
        <div><Toaster/></div>
        <p className="text-xl mb-6 max-w-2xl mx-auto">
          Discover your next favorite book from our vast collection of titles
        </p>
        <Link href="/books">
          <Button size="lg">Browse All Books</Button>
        </Link>
      </section>

      {/* Featured Books */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Books</h2>
          <Link href="/books" className="text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 text-black md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg text-center transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
