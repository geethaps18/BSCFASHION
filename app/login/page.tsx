"use client"; // MUST BE FIRST

import { Suspense } from "react";
import LoginPageInner from "@/components/LoginPageInner";

export const dynamic = "force-dynamic";  // OK HERE for Next.js 15

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
