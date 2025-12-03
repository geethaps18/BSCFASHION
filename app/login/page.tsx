"use client";

import { Suspense } from "react";
import LoginPageInner from "@/components/LoginPageInner";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
