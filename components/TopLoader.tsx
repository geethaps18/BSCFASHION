"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// ✅ PROFESSIONAL CONFIG
NProgress.configure({
  showSpinner: false,        // ❌ remove blue spinner
  trickleSpeed: 120,
  minimum: 0.15,
});

export default function TopLoader() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    return () => {
      NProgress.done();
    };
  }, [pathname]);

  return null;
}
