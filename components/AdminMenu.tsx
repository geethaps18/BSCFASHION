"use client";
import { useState } from "react";
import Link from "next/link";

export default function AdminMenu() {
  const [open, setOpen] = useState(false);

  // ✅ later you can replace with real authentication (isAdmin flag)
  const isAdmin = true; 

  if (!isAdmin) return null; // normal users won't see anything

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 bg-gray-800 text-white rounded-md"
      >
        ☰
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg p-3 space-y-2">
          <Link href="/orders" className="block text-gray-800 hover:text-green-600">
            Orders
          </Link>
          <Link href="/additems" className="block text-gray-800 hover:text-green-600">
            Add Items
          </Link>
          <Link href="/users" className="block text-gray-800 hover:text-green-600">
            Users
          </Link>
          <Link href="/profits" className="block text-gray-800 hover:text-green-600">
            Profits
          </Link>
        </div>
      )}
    </div>
  );
}
