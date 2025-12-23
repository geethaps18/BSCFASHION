"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, X, ArrowLeft,Store, User } from "lucide-react";
import { useCart } from "@/app/context/BagContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { Product } from "@/types/product";
import SearchBarClient from "./SearchBarClient";
import { getCookie } from "cookies-next/client";
import { LayoutDashboard } from "lucide-react";
import { Suspense } from "react";
import { categories } from "@/data/categories";





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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);



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

     <div className="w-full px-4 md:px-8 py-2 sm:py-3 flex items-center justify-between gap-2">
        {/* Left: Back Arrow + Logo + Page Name */}
        <div className="flex items-center gap-4">
         {isBackArrowPage && (
  <div
    className="lg:hidden cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition"
    onClick={() => router.back()}
  >
    <ArrowLeft className="w-5 h-5 text-gray-700" />
  </div>
)}



          

        {/* LOGO */}
<div
  className={`
    w-12 h-12 bg-yellow-300 border rounded-lg
    flex items-center justify-center overflow-hidden p-1 shadow-sm
    cursor-pointer
    ${pathname !== "/" ? "hidden lg:flex" : "flex"}
  `}
  onClick={() => router.push("/")}
>
  <img
    src="/images/logo.png"
    alt="BSCFASHION Logo"
    className="max-w-full max-h-full object-contain"
  />
</div>


         {isBackArrowPage && (
  <div className="flex flex-col lg:hidden">
    <span className="font-medium text-gray-800 text-sm">
      {pageName}
    </span>
    {mounted && productCount > 0 && (
      <span className="text-xs text-gray-500">
        {productCount} Products
      </span>
    )}
  </div>
)}

        </div>
{/* DESKTOP HOVER ZONE */}
<div
  className="hidden lg:block relative"
  onMouseLeave={() => setActiveCategory(null)}
>
  {/* CATEGORY BAR */}
  <div className="border-t">
    <div className="w-full px-10 h-12 flex items-center gap-8 text-sm font-medium text-gray-700 overflow-hidden">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="relative flex-shrink-0"
          onMouseEnter={() => setActiveCategory(cat.name)}
        >
          <span
            className="
              block
              max-w-[110px]
              whitespace-nowrap
              overflow-hidden
              text-ellipsis
              cursor-pointer
              hover:text-black
            "
            title={cat.name}
          >
            {cat.name}
          </span>
        </div>
      ))}
    </div>
  </div>

  {/* MEGA MENU */}
  {activeCategory && (
    <div className="absolute left-0 right-0 top-full bg-white border-t shadow-2xl z-50">
      <div className="w-full px-1 py-8 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-4 gap-10">
          {categories
            .find((c) => c.name === activeCategory)
            ?.subCategories.map((sub) => (
              <div key={sub.id}>
               <Link
  href={`/categories/${activeCategory
    .toLowerCase()
    .replace(/\s+/g, "-")}/${sub.name
    .toLowerCase()
    .replace(/\s+/g, "-")}`}
  className="block font-semibold text-gray-900 mb-4 hover:text-black"
>
  {sub.name}
</Link>

                <ul className="space-y-2">
                  {sub.subCategories.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${activeCategory
                          .toLowerCase()
                          .replace(/\s+/g, "-")}/${sub.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}/${child.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="text-sm text-gray-600 hover:text-black"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  )}
</div>

{/* Right Icons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
            className=" p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 stroke-[1.2]" />
          </button>
          {/* DESKTOP ACCOUNT */}
{mounted && (
  <Link
    href="/account"
    className="hidden lg:flex p-2 rounded-full hover:bg-gray-100 transition"
    title="Account"
  >
    <User className="w-5 h-5 text-gray-600 stroke-[1.2]" />
  </Link>
)}


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
  <>
    {/* 🔲 BACKDROP (desktop only) */}
    <div
      className="hidden lg:block fixed inset-0 bg-black/20 z-40"
      onClick={() => setIsSearchOpen(false)}
    />

    {/* 🔍 SEARCH CONTAINER */}
    <div
      className="
        fixed inset-0 z-50 bg-white
        lg:absolute lg:inset-auto lg:top-full lg:left-1/2 lg:-translate-x-1/2
        lg:mt-3 lg:w-full lg:max-w-3xl lg:rounded-xl lg:shadow-2xl
      "
    >
      {/* TOP BAR */}
      <div className="flex items-center gap-3 p-4 border-b">
        {/* Back only on mobile */}
        <button
          onClick={() => setIsSearchOpen(false)}
          className="lg:hidden p-2 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft size={22} className="text-gray-600" />
        </button>

        <div className="flex-1">
          <Suspense fallback={null}>
            <SearchBarClient placeholder="Search for sarees, men, kids, bedsheets…" />
          </Suspense>
        </div>

        {/* Close icon for desktop */}
        <button
          onClick={() => setIsSearchOpen(false)}
          className="hidden lg:flex p-2 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* RESULTS SCROLL AREA */}
       <div className="max-h-[320px] overflow-y-auto px-4 py-3">
        {/* SearchBarClient renders suggestions internally */}
      </div>
    </div>
  </>
)}

    </header>
  );
}
