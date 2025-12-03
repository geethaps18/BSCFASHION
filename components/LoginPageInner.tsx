"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { setCookie, getCookie } from "cookies-next";

export default function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
  const token = String(getCookie("token", { path: "/" }) || "");


  if (!token || token === "undefined") return;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < now) {
      // 🔥 ONE-MOVE FIX: clear expired token
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return;
    }

    // ✔ Token is valid → redirect normally
    router.replace(redirectTo);
  } catch {
    // 🔥 If token is invalid → remove it
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}, []);



  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(true);
  const [verified, setVerified] = useState(false);

  const isEmail = (input: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const handleSendOtp = async () => {
    if (!contact) {
      toast.error("Enter phone or email");
      return;
    }
    if (!isPhone && !isEmail(contact)) {
      toast.error("Enter valid email");
      return;
    }

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
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: "/",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production", 
});



        toast.success("Login successful!");
       setVerified(true);

      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  if (verified) {
    router.replace(redirectTo); // replace = no back button issue
  }
}, [verified]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

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
