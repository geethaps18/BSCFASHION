"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { setCookie, getCookie } from "cookies-next";
import Link from "next/link";
import { signIn } from "next-auth/react";


export default function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
 const rawRedirect = searchParams.get("redirect") || "/";
const redirectTo = rawRedirect.startsWith("/")
  ? rawRedirect
  : `/${rawRedirect}`;


  // 🔥 If already logged in → redirect
  useEffect(() => {
  if (redirectTo) {
    sessionStorage.setItem("auth_redirect", redirectTo);
  }
}, [redirectTo]);

  useEffect(() => {
    const token = String(getCookie("token") || "");

    if (!token || token === "undefined") return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);

      if (!payload.exp || payload.exp < now) {
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return;
      }

      router.replace(redirectTo);
    } catch {
      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, []);
  

  // ------------------------
  // EMAIL ONLY LOGIN
  // ------------------------
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Send OTP
  const handleSendOtp = async () => {
    if (!email) return toast.error("Enter your email");
    if (!isEmailValid(email)) return toast.error("Enter valid email");

    setLoading(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "OTP sent to your email");
        setOtpSent(true);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  // Verify OTP
 const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!otp) return toast.error("Enter OTP");

  setLoading(true);

  try {
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: email, otp }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      setCookie("token", data.token, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });

      sessionStorage.removeItem("loginToastShown");
      toast.success("Login successful");
      setVerified(true);
    } else {
      if (res.status === 404) {
        toast.error("Account not found. Please sign up first.");
        setTimeout(() => {
          router.push(`/signup?redirect=${encodeURIComponent(redirectTo)}`);
        }, 1500);
      } else if (res.status === 403) {
        toast.error("Your account is blocked. Please contact support.");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    }
  } catch (error) {
    toast.error("Something went wrong");
  } finally {
    setLoading(false);
  }
};


  // Redirect after success
  useEffect(() => {
    if (verified) router.replace(redirectTo);
  }, [verified]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-lg">
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
         <Link href="/">
  <img
    src="/images/logo.png"
    alt="BSCFashion Logo"
    className="w-40 h-40 object-contain cursor-pointer"
  />
</Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

        {/* Email Login Only */}
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {!otpSent && (
            <>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border px-3 py-2 rounded-md"
              />

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-yellow-500 text-white py-2 rounded-md"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
            
          )}
          <button
  type="button"
  onClick={() => signIn("google")}
  className="w-full flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-100 mb-4"
>
  <img src="/google.svg" alt="Google" className="w-5 h-5" />
  Continue with Google
</button>

<div className="text-center text-sm text-gray-400 mb-4">
  OR
</div>


          {otpSent && !verified && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border px-3 py-2 rounded-md"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 text-white py-2 rounded-md"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {verified && (
            <p className="text-green-600 text-center">
              Login successful! Redirecting...
            </p>
          )}
        </form>

        <p className="text-center mt-4">
          New here?{" "}
          <button
            onClick={() =>
              router.push(`/signup?redirect=${encodeURIComponent(redirectTo)}`)
            }
            className="text-yellow-500 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
