export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";     // <-- important
export const fetchCache = "force-no-store"; // <-- important

import { Suspense } from "react";
import LoginPageInner from "@/components/LoginPageInner";


export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
