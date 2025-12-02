"use client";

import { Suspense } from "react";
import LoginPageInner from "@/components/LoginPageInner";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
