// components/SiteContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SiteContextType = {
  siteId: string | null;
  setSiteId: (id: string) => void;
};

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [siteId, setSiteId] = useState<string | null>(null);

  // 🔥 AUTO-LOAD SELLER SITE
  useEffect(() => {
    fetch("/api/builder/site")
      .then((res) => res.json())
      .then((site) => {
        if (site?.id) {
          setSiteId(site.id);
        }
      })
      .catch(() => {
        setSiteId(null);
      });
  }, []);

  return (
    <SiteContext.Provider value={{ siteId, setSiteId }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error("useSite must be used inside SiteProvider");
  }
  return ctx;
}
