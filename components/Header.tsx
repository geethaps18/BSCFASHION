"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useCart } from "@/app/context/BagContext";

export default function Header() {
  const router = useRouter();
  const { user } = useUser();
  const { totalCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo */}
        <div
          className="bg-yellow-300 shadow-lg rounded-2xl p-2 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => router.push("/")}
        >
          <Image
            src="/images/logo.png"
            alt="BSC Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-md">
          <div className="flex items-center w-full border border-gray-300 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-gray-300 transition">
            <Search className="w-5 h-5 text-gray-500 stroke-[1.2]" />
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full outline-none px-3 py-1 text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile Search */}
          <button
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Search className="w-6 h-6 text-gray-500 stroke-[1.2]" />
          </button>

          {/* Wishlist */}
          {mounted && (
            <Link
              href={user ? "/wishlist" : "/login"}
              aria-label="Wishlist"
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Heart className="w-6 h-6 text-gray-500 stroke-[1.2]" />
            </Link>
          )}

          {/* Cart */}
          {mounted && (
            <Link
              href="/bag"
              aria-label="Shopping Bag"
              className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ShoppingBag className="w-6 h-6 text-gray-500 stroke-[1.2]" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {totalCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Menu */}
          <div className="relative">
            <Menu
              className="w-6 h-6 cursor-pointer p-2 rounded-full hover:bg-gray-100 transition stroke-[1.2] text-gray-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <ul className="flex flex-col">
                  <li
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => router.push("/additems")}
                  >
                    Add Products
                  </li>
                  <li
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => router.push("/orders")}
                  >
                    Orders
                  </li>
                  <li
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => router.push("/profits")}
                  >
                    Profits
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-6">
          <div className="flex items-center mb-4">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-gray-600 font-medium mr-4"
            >
              Close
            </button>
            <div className="flex items-center flex-1 border border-gray-300 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-gray-300 transition">
              <Search className="w-5 h-5 text-gray-500 stroke-[1.2]" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full outline-none px-3 py-1 text-sm text-gray-700 placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
