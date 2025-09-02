"use client";

import { useRouter } from "next/navigation";
import { SignOutButton, useClerk } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

export default function SignOutLink() {
  const router = useRouter();
  const { signOut } = useClerk(); // get signOut function

  const handleSignOut = async () => {
    await signOut(); // perform sign out
    toast.success("Signed out successfully");
    router.push("/"); // redirect after sign out
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Sign Out
    </button>
  );
}
