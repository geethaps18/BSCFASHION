"use client";

import { Home, Package, MapPin, LayoutGrid, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Footer() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/categories", icon: LayoutGrid, label: "Categories" },
    { href: "/orders", icon: Package, label: "My Orders" },
    { href: "/store", icon: MapPin, label: "Store" },
    { href: "/account", icon: User, label: "Account" },
  ];

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.href === pathname);
    setActiveIndex(index !== -1 ? index : 0);
  }, [pathname]);

  const inactiveColor = "#8e8e8e"; // subtle gray
  const activeGradient =
    "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)";

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-sm z-50">
      <div className="relative flex justify-around items-center h-14 sm:h-16">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center w-full h-full transition-transform hover:scale-105"
            >
              <tab.icon
                className="w-4 h-4 sm:w-6 sm:h-6 transition-all duration-300 stroke-[1.2]"
                style={{
                  color: isActive ? undefined : inactiveColor,
                  background: isActive ? activeGradient : "transparent",
                  WebkitBackgroundClip: isActive ? "text" : "unset",
                  WebkitTextFillColor: isActive ? "transparent" : undefined,
                }}
              />
              <span
                className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 transition-colors duration-300"
                style={{
                  color: isActive ? "#262626" : inactiveColor,
                  fontWeight: 400,
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
