"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Package, ShoppingBag, BarChart3, Settings, LayoutDashboard  } from "lucide-react";
import { SiteProvider, useSite } from "@/components/SiteContext";

const menu = [
  
  { name: "Products", href: "/builder/products", icon: Package },
  { name: "Orders", href: "/builder/orders", icon: ShoppingBag },
  { name: "Analytics", href: "/builder/analytics", icon: BarChart3 },
  { name: "Settings", href: "/builder/settings", icon: Settings },
];

function BuilderLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { siteId } = useSite();

  return (
     <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
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
          <span className="text-xs text-gray-500">Seller Panel</span>
        </div>

      </Link>

        <nav className="space-y-1">
          {menu.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                  active
                    ? "bg-yellow-500 text-white"
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

      {/* Content */}
      <main className="ml-64 flex-1 p-6">
        {!siteId ? (
          <div className="mt-20 text-center text-gray-500">
            No website assigned to your account.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteProvider>
      <BuilderLayoutInner>{children}</BuilderLayoutInner>
    </SiteProvider>
  );
}
