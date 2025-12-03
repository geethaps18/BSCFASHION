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

  // -------------------------------------
  // FIX 1: CHECK LOGIN USING EFFECT
  // -------------------------------------
  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      router.replace(redirectTo);
      router.refresh();
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

  // -------------------------------------
  // SEND OTP
  // -------------------------------------
  const handleSendOtp = async () => {
    if (!contact) return toast.error("Enter phone/email");
    if (!isPhone && !isEmail(contact)) return toast.error("Enter valid email");

    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ contact }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent");
        setOtpSent(true);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // VERIFY OTP
  // -------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Enter OTP");

    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ contact, otp }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // SAVE COOKIE
        setCookie("token", data.token, {
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        toast.success("Login successful!");
        setVerified(true);

        // -------------------------------------
        // FIX 2: WAIT FOR COOKIE TO SET
        // -------------------------------------
        await new Promise((r) => setTimeout(r, 150));

        // -------------------------------------
        // FIX 3: FORCE RE-RENDER APP STATE
        // -------------------------------------
        router.refresh();

        // -------------------------------------
        // FIX 4: INSTANT REDIRECT
        // -------------------------------------
        router.replace(redirectTo);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // Redirect UI
  // -------------------------------------
  useEffect(() => {
    if (verified) {
      const t = setTimeout(() => {
        router.replace(redirectTo);
        router.refresh();
      }, 200);

      return () => clearTimeout(t);
    }
  }, [verified]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Login / Sign Up</h1>

        <div className="mb-4 flex justify-center">
          <button
            className={`px-4 py-2 rounded-l-md ${
              isPhone ? "bg-yellow-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setIsPhone(true)}
          >
            Phone
          </button>
          <button
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
      </div>
    </div>
  );
}
