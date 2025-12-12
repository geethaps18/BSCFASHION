"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Users2,
  BarChart3,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Products", href: "/admin/products", icon: PackageSearch },
  { name: "Customers", href: "/admin/customers", icon: Users2 },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white h-screen fixed left-0 top-0 p-4 shadow-sm">

      {/* ---------------- LOGO + TITLE (HORIZONTAL) ---------------- */}
      <Link href="/" className="flex items-center gap-3 mb-8 cursor-pointer px-2">
        
        {/* Logo */}
        <div className="w-12 h-12 bg-yellow-300 border rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-sm">
          <img
            src="/images/logo.png"
            alt="BSCFASHION Logo"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Store Name & Subtitle */}
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold">
            BSC<span className="text-yellow-500">FASHION</span>
          </span>
          <span className="text-xs text-gray-500">Admin Panel</span>
        </div>

      </Link>
      {/* ------------------------------------------------------------ */}

      {/* Nav Links */}
      <nav className="space-y-1 mt-6">
        {menu.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                isActive
                  ? "bg-yellow-500 text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
