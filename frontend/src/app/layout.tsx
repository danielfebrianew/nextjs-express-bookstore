import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";
import QueryProvider from "../components/provider/QueryProvider";
import AuthCheck from "./provider/auth-check";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookStore - Your Online Bookshop",
  description: "Find and buy your favorite books online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
            <Toaster position="top-center" />
            <AuthCheck />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="bg-gray-100 py-6">
                <div className="container mx-auto px-4 text-center text-gray-600">
                  <p>© {new Date().getFullYear()} BookStore. All rights reserved.</p>
                </div>
              </footer>
            </div>
        </QueryProvider>
      </body>
    </html>
  );
}
