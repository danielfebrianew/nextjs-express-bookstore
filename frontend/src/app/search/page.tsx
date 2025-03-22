"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { booksAPI } from "@/lib/api"; // Pastikan path sesuai dengan api.ts
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // Ambil query dari URL
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) return;
    const fetchSearchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await booksAPI.searchBooks(query);
        setSearchResults(data.results);
      } catch (err) {
        setError("Failed to fetch search results.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Search Results for: "{query}"</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && searchResults.length === 0 && (
        <p>No books found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map((book: any) => (
          <div key={book.id} className="border p-4 rounded-md">
            <h2 className="text-lg font-semibold">{book.title}</h2>
            <p className="text-gray-600">{book.author}</p>
            <p className="text-primary font-bold">${book.price}</p>
            <Link href={`/books/${book.id}`}>
              <Button className="mt-2 w-full">View Details</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
