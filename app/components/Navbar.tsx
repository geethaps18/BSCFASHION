"use client";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-bold tracking-wide hover:text-green-400 transition"
      >
        BSCFASHION
      </Link>

      {/* Links */}
      <div className="flex space-x-6 items-center text-lg font-medium">
        <Link href="/" className="hover:text-green-400 transition">
          Home
        </Link>
        <Link href="/additems" className="hover:text-green-400 transition">
          Add Items
        </Link>
        <Link href="/items" className="hover:text-green-400 transition">
          View Items
        </Link>
        <Link
          href="/wishlist"
          className="flex items-center gap-1 hover:text-green-400 transition"
        >
          <Heart className="w-5 h-5" /> Wishlist
        </Link>
      </div>
    </nav>
  );
}
