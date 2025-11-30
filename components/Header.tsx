"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X, ArrowLeft, Layout } from "lucide-react";
import { useCart } from "@/app/context/BagContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { Product } from "@/types/product";

const trendingProducts = [
  "Silk Saree",
  "Cotton Saree",
  "Men's Kurta",
  "Kids Wear",
  "Bedsheets",
  "Mats",
  "T-Shirts",
];

interface HeaderProps {
  productName?: string;
}

export default function Header({ productName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { wishlistItems } = useWishlist();

  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => setMounted(true), []);

  // Fetch popular products
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch("/api/popular-products");
        const data = await res.json();
        setPopularProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        console.error(err);
        setPopularProducts([]);
      }
    };
    fetchPopular();
  }, []);

  // Determine page display name
  const getPageName = () => {
    if (productName) return productName;

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Home";

    if (segments[0] === "categories") {
      const lastSegment = segments[segments.length - 1];
      return lastSegment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    switch (segments[0]) {
      case "wishlist":
        return "Wishlist";
      case "bag":
        return "Bag";
      case "orders":
        return "Orders";
      case "profits":
        return "Profits";
      default:
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    }
  };

  const pageName = getPageName();

  // Fetch product count for current category page
  useEffect(() => {
    const fetchProductCount = async () => {
      try {
        if (pathname.startsWith("/categories")) {
          const segments = pathname.split("/").filter(Boolean).slice(1);
          const mainCat = segments[0] || "";
          const sub1 = segments[1] || "";
          const sub2 = segments[2] || "";

          // Only filter by the last category available
          const lastCategoryQuery = sub2 || sub1 || mainCat;

          const res = await fetch(
            `/api/products?main=${encodeURIComponent(mainCat)}&sub1=${encodeURIComponent(
              sub1
            )}&sub2=${encodeURIComponent(sub2)}`
          );
          const data = await res.json();
          setProductCount(data.products?.length || 0);
        } else if (pathname === "/wishlist") {
          setProductCount(wishlistItems.length);
        } else if (pathname === "/bag") {
          setProductCount(totalCount);
        } else {
          setProductCount(0); // Hide count on other pages
        }
      } catch (err) {
        console.error(err);
        setProductCount(0);
      }
    };
    fetchProductCount();
  }, [pathname, wishlistItems, totalCount]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const noArrowPages = ["/", "/bag"];
  const isBackArrowPage = !noArrowPages.includes(
    pathname.split("/")[1] ? `/${pathname.split("/")[1]}` : "/"
  );

  const showHeartIcon = pathname !== "/wishlist";

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
        {/* Left: Back Arrow + Logo + Page Name */}
        <div className="flex items-center gap-4">
          {isBackArrowPage && (
            <div
              className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </div>
          )}

          {pathname === "/" && (
            <div
              className="bg-yellow-300 shadow-lg rounded-2xl p-1.5 sm:p-2 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
              onClick={() => router.push("/")}
            >
              <Image
                src="/images/logo.png"
                alt="BSC Logo"
                width={40}
                height={40}
                className="object-contain w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
          )}

          {isBackArrowPage && (
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 text-sm sm:text-base">
                {pageName}
              </span>
              {mounted && productCount > 0 && (
                <span className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {productCount} Product{productCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex flex-1 max-w-md"
        >
          <div className="flex items-center w-full border border-gray-300 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-gray-300 transition">
            <Search className="w-5 h-5 text-gray-500 stroke-[1.2]" />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none px-3 py-1 text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </form>

        {/* Right Icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 stroke-[1.2]" />
          </button>

          {mounted && showHeartIcon && (
            <Link
              href="/wishlist"
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 stroke-[1.2]" />
            </Link>
          )}

          {mounted && (
            <Link
              href="/bag"
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 stroke-[1.2]" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gray-900 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm">
                  {totalCount}
                </span>
              )}
            </Link>
          )}

          <div className="relative">
            <Menu
              className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition stroke-[1.2] text-gray-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg z-50">
                <ul className="flex flex-col text-sm">
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => router.push("/additems")}
                  >
                    Add Products
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => router.push("/admin/orders")}
                  >
                    Orders
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
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
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center mb-3">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-gray-600 font-medium mr-3"
            >
              Close
            </button>
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center flex-1 border border-gray-300 rounded-full px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-gray-300 transition"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 stroke-[1.2]" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none px-2 text-sm sm:text-base text-gray-700 placeholder-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>

          {!searchQuery && (
            <div className="mb-6 flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">
                  Trending Products
                </h2>
                <div className="flex flex-col gap-3">
                  {trendingProducts.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        router.push(`/search?query=${encodeURIComponent(item)}`);
                        setIsSearchOpen(false);
                      }}
                      className="w-50 sm:w-50 px-4 py-2 bg-gray-100 text-sm font-medium hover:bg-gray-200 text-left rounded-lg"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {popularProducts.length > 0 && (
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">
                    Popular Products
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {popularProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          router.push(`/product/${product.id}`);
                          setIsSearchOpen(false);
                        }}
                      >
                        <Image
                          src={product.images?.[0] || "/images/logo.png"}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{product.name}</span>
                          <span className="text-xs text-gray-600">₹{product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
