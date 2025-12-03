"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { getCookie } from "cookies-next";
import Image from "next/image";

export default function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(true);
  const [checkingLogin, setCheckingLogin] = useState(true);

  // ---------------------------
  // CHECK ALREADY LOGGED IN
  // ---------------------------
  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      router.replace(redirectTo);
    } else {
      setCheckingLogin(false);
    }
  }, []);

  // ---------------------------
  // SEND OTP
  // ---------------------------
  const handleSendOtp = async () => {
    if (!contact) return toast.error("Enter phone or email");

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
        toast.error(data.message);
      }
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

      if (!res.ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }

      // COOKIE IS SET AUTOMATICALLY IN API — DO NOT SET HERE
      toast.success("Login successful!");

      // 🔥 INSTANT redirect (NO REFRESH NEEDED)
      router.replace(redirectTo);

    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // RENDER
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
          <Image src="/images/logo.png" width={120} height={120} alt="BSCFASHION Logo" />
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

        {/* BUTTON SWITCH */}
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
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {otpSent && (
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
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </>
          )}
        </form>

      </div>
    </div>
  );
}
