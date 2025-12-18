"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X, ArrowLeft,Store, Layout } from "lucide-react";
import { useCart } from "@/app/context/BagContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { Product } from "@/types/product";
import SearchBarClient from "./SearchBarClient";
import { getCookie } from "cookies-next/client";
import { LayoutDashboard } from "lucide-react";
import { Suspense } from "react";




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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);


useEffect(() => {
  const checkRoles = async () => {
    const token = getCookie("token");
    if (!token) return;

    const res = await fetch("/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    const user = data.user;

    if (!user) return;

    // ADMIN check (unchanged logic)
    if (user.contact === process.env.NEXT_PUBLIC_ADMIN_CONTACT) {
      setIsAdmin(true);
      setIsSeller(false);
      return;
    }

    // SELLER check
    if (user.role === "SELLER") {
      setIsSeller(true);
      setIsAdmin(false);
      return;
    }

    // CUSTOMER fallback
    setIsAdmin(false);
    setIsSeller(false);
  };

  checkRoles();
}, []);




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
          
               <div className="w-12 h-12 bg-yellow-300 border rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-sm "onClick={() => router.push("/")}>
          <img
            src="/images/logo.png"
            alt="BSCFASHION Logo"
            className="max-w-full max-h-full object-contain"
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

 <div className="hidden lg:flex flex-1 max-w-md">
  <Suspense fallback={null}>
    <SearchBarClient
      placeholder="Search for sarees, men, kids, bedsheets…"
      disableOutsideClose={true}
      autoOpen={true}
    />
  </Suspense>
</div>

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

        {isAdmin && (
  <div className="relative">
    <LayoutDashboard
      className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 stroke-[1.2]" 
      onClick={() => router.push("/admin")}
    />
  </div>
)}

{isSeller && (
  <button
    onClick={() => router.push("/builder")}
    title="Seller Panel"
    className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition"
  >
    <Store className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 stroke-[1.2]" />
  </button>
)}


        </div>
      </div>

{isSearchOpen && (
  <div className="fixed top-0 left-0 right-0 bg-white z-50 p-4 shadow-md">
    {/* Top bar: Back + SearchBar */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => setIsSearchOpen(false)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
      >
        <ArrowLeft size={22} className="text-gray-600" />
      </button>

      <div className="flex-1">
  <Suspense fallback={null}>
    <SearchBarClient
      placeholder="Search for sarees, men, kids, bedsheets…"
      autoOpen={true}
    />
  </Suspense>
</div>

    
                  </div>
                </div>
              )}
    </header>
  );
}
