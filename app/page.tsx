import { headers } from "next/headers";
import ClientShell from "@/components/ClientShell";
import HomeInner from "@/app/HomeInner"; // or your actual home component
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default async function Page() {
  const headersList = await headers();              // ✅ get headers
  const userAgent = headersList.get("user-agent") || ""; // ✅ define userAgent

  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

  return (
   <ClientShell>
  <HomeInner />
  
</ClientShell>

  );
}
