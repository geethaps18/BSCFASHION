"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { Suspense } from "react";
import LoginPageInner from "@/components/LoginPageInner";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
