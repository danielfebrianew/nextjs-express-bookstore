"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCartStore } from "@/lib/stores/cart-store";
import toast from "react-hot-toast";

export default function Navbar() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const totalItems = useCartStore((s) => s.totalItems);
  const router = useRouter();

  const { user, loading, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => { checkAuth(); }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isLoggedIn = !!user;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-black hover:scale-105 transition-transform">
              BookStore
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/" className="text-gray-700 hover:scale-105 transition-transform">Home</Link>
              <Link href="/books" className="text-gray-700 hover:scale-105 transition-transform">Books</Link>
              <Link href="/categories" className="text-gray-700 hover:scale-105 transition-transform">Categories</Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block text-black flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="flex">
              <Input
                type="text"
                placeholder="Search for books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-black focus:border-2 focus:border-white bg-white"
              />
              <Button type="submit" className="ml-2 transform transition-transform hover:scale-105">
                Search
              </Button>
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="text-gray-700 hover:text-primary relative transform transition-transform hover:scale-105"
              onClick={(e) => {
                // Check if the user is logged in
                if (!isLoggedIn) {
                  e.preventDefault(); // Prevent navigation if the user is not logged in
                  toast.error('You must be logged in to access the cart!'); // Show error message
                  return; // Stop further execution
                }
              }}
            >
              <span className="sr-only">Cart</span>
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth Buttons */}
            {loading ? (
              <div className="text-gray-700" suppressHydrationWarning>Loading...</div>
            ) : isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-gray-700 hover:text-primary transform transition-transform hover:scale-105"
                >
                  <User size={24} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg">
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" className="transform transition-transform hover:scale-105">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-white text-black transform transition-transform hover:scale-105">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="flex">
            <Input
              type="text"
              placeholder="Search for books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button type="submit" className="ml-2">
              Search
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}
