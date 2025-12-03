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

  const [checkingAuth, setCheckingAuth] = useState(true);

  // ------------------------------------------
  // 🔥 FIX: SAFE TOKEN CHECK (NO LOOP)
  // ------------------------------------------
  useEffect(() => {
    const token = getCookie("token");
    if (token && token !== "undefined") {
      router.replace(redirectTo);
    } else {
      setCheckingAuth(false); // allow page to show
    }
  }, []);

  // Show nothing until we know if user is logged in
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Checking login...
      </div>
    );
  }

  // ------------------------------------------
  // LOGIN STATE
  // ------------------------------------------
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(true);
  const [verified, setVerified] = useState(false);

  const isEmail = (input: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  // ------------------------------------------
  // SEND OTP
  // ------------------------------------------
  const handleSendOtp = async () => {
    if (!contact) return toast.error("Enter phone or email");

    if (!isPhone && !isEmail(contact)) {
      return toast.error("Enter valid email");
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
        toast.success("OTP sent");
        setOtpSent(true);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Internet issue. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // VERIFY OTP
  // ------------------------------------------
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
        });

        setVerified(true);
        setTimeout(() => {
          router.replace(redirectTo);
        }, 800);
      } else {
        toast.error("Invalid OTP");
      }
    } catch {
      toast.error("Unable to verify. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => setIsPhone(true)}
            className={`px-4 py-2 rounded-l-md ${
              isPhone ? "bg-yellow-500 text-white" : "bg-gray-200"
            }`}
          >
            Phone
          </button>

          <button
            type="button"
            onClick={() => setIsPhone(false)}
            className={`px-4 py-2 rounded-r-md ${
              !isPhone ? "bg-yellow-500 text-white" : "bg-gray-200"
            }`}
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
                  onChange={(v) => setContact("+" + v)}
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
                disabled={loading}
                onClick={handleSendOtp}
                className="w-full bg-yellow-500 text-white py-2 rounded-md"
              >
                {loading ? "Sending..." : "Send OTP"}
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
                className="w-full bg-gray-900 text-white py-2 rounded-md"
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
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
