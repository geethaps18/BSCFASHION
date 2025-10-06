"use client";

import { useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { toast } from "react-hot-toast";

export default function SignOutLink() {
  const router = useRouter();

  const handleSignOut = () => {
    // ✅ Remove JWT cookie
    deleteCookie("token", { path: "/" });

    toast.success("Signed out successfully ✅");

    // ✅ Redirect to home page
    router.push("/");
    router.refresh(); // refresh the page to reset state if needed
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
    >
      Sign Out
    </button>
  );
}
