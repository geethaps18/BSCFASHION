"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";

export default function GoogleTokenBridge() {
  const { data, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const run = async () => {
      const res = await fetch("/api/auth/google-jwt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data?.user?.email,
        }),
      });

      const json = await res.json();

      if (json.token) {
        setCookie("token", json.token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });

        // ✅ RESTORE ORIGINAL PAGE
        const redirect =
          sessionStorage.getItem("auth_redirect") || "/";

        sessionStorage.removeItem("auth_redirect");

        router.replace(redirect);
      }
    };

    run();
  }, [status]);

  return null;
}
