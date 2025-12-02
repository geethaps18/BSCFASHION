import { Suspense } from "react";
import SignupPageInner from "@/components/SignupPageInner";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageInner />
    </Suspense>
  );
}
