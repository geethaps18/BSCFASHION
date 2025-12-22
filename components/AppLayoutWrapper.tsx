"use client";

import { usePathname } from "next/navigation";
import PolicyFooter from "@/components/PolicyFooter";
import DesktopFooter from "@/components/DesktopFooter";
import OfflineBanner from "@/components/OfflineBanner";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isSeller = pathname.startsWith("/seller");

  return (
    <main className="min-h-screen">
      {!isAdmin && !isSeller && <OfflineBanner />}

      {children}

      {!isAdmin && !isSeller && <PolicyFooter />}
      {!isAdmin && !isSeller && <DesktopFooter />}
    </main>
  );
}
