"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default function Navbar() {
  const { logout } = useAuth();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl text-black hover:scale-105 transition-transform font-bold text-primary">
              BookStore
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/" className="text-gray-700 hover:scale-105 transition-transform">
                Home
              </Link>
              <Link href="/books" className="text-gray-700 hover:scale-105 transition-transform">
                Books
              </Link>
              <Link
                href="/categories"
                className="text-gray-700 hover:scale-105 transition-transform"
              >
                Categories
              </Link>
            </div>
          </div>

          {/* Search bar */}
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

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="text-gray-700 hover:text-primary relative transform transition-transform hover:scale-105">
              <span className="sr-only">Cart</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-gray-700 hover:text-primary"
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

        {/* Mobile search bar */}
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
