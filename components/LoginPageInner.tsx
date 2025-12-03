"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { setCookie, getCookie } from "cookies-next";
import Image from "next/image";

export default function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // ---------------------------
  // HOOKS
  // ---------------------------
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(true);
  const [verified, setVerified] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true); // stays here

 // ---------------------------
// CHECK IF ALREADY LOGGED IN
// ---------------------------
useEffect(() => {
  const token = getCookie("token");
  if (token) {
    router.push(redirectTo || "/");
  } else {
    setCheckingLogin(false);
  }
}, []);

// ---------------------------
// REDIRECT AFTER VERIFIED
// ---------------------------
useEffect(() => {
  if (!verified) return;

  const timer = setTimeout(() => {
    router.push(redirectTo || "/");
  }, 100);

  return () => clearTimeout(timer);
}, [verified]);


  // ---------------------------
  // HELPERS
  // ---------------------------
  const isEmail = (input: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  // ---------------------------
  // SEND OTP
  // ---------------------------
  const handleSendOtp = async () => {
    if (!contact) return toast.error("Enter phone or email");
    if (!isPhone && !isEmail(contact)) return toast.error("Enter valid email");

    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "OTP sent");
        setOtpSent(true);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // VERIFY OTP
  // ---------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Enter OTP");

    setLoading(true);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, otp }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setCookie("token", data.token, {
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

       toast.success("Login successful!");

setTimeout(() => {
  setVerified(true);
  router;   // 🔥 force re-render of whole app
}, 50);


      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // UI RENDER
  // ---------------------------
  if (checkingLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Checking...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-lg">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo.png"
            width={120}
            height={120}
            alt="BSCFASHION Logo"
            className="object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

        {/* PHONE / EMAIL SWITCH */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            className={`px-4 py-2 rounded-l-md ${
              isPhone ? "bg-yellow-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setIsPhone(true)}
          >
            Phone
          </button>

          <button
            type="button"
            className={`px-4 py-2 rounded-r-md ${
              !isPhone ? "bg-yellow-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setIsPhone(false)}
          >
            Email
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleVerifyOtp} className="space-y-4">

          {!otpSent && (
            <>
              {isPhone ? (
                <PhoneInput
                  country="in"
                  value={contact}
                  onChange={(phone) => setContact("+" + phone)}
                  inputStyle={{ width: "100%" }}
                />
              ) : (
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full border px-3 py-2 rounded-md"
                />
              )}

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
                {loading ? "Verifying..." : "Verify OTP & Login"}
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
