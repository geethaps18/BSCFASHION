"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { setCookie } from "cookies-next";

export default function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capture redirect param from URL, fallback = home
  const redirectTo = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(true);
  const [verified, setVerified] = useState(false);

  const isEmail = (input: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  // Send OTP
  const handleSendOtp = async () => {
    if (!name || !contact) return toast.error("Enter name and phone/email");
    if (!isPhone && !isEmail(contact))
      return toast.error("Enter a valid email address");

    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "OTP sent ✅");
        setOtpSent(true);
      } else {
        toast.error(data.message || "Failed to send OTP ❌");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP & signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Enter OTP");

    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, otp, signup: true }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        // Save token
        setCookie("token", data.token, {
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        toast.success("Signup successful ✅");
        setVerified(true);

        // Redirect back to original page
        router.push(redirectTo);
      } else {
        toast.error(data.message || "Invalid OTP ❌");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-700 text-center">
          Sign Up
        </h1>

        {/* Toggle Phone / Email */}
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

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Contact input */}
          {!otpSent &&
            (isPhone ? (
              <PhoneInput
                country="in"
                value={contact}
                onChange={(phone) => setContact("+" + phone)}
                inputClass="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                inputStyle={{ width: "100%" }}
                containerClass="w-full"
                enableSearch
                countryCodeEditable
              />
            ) : (
              <input
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="email@example.com"
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            ))}

          {/* Send OTP */}
          {!otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-yellow-500 text-white py-2 rounded-md font-semibold hover:bg-yellow-600 transition"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          )}

          {/* OTP input & verify */}
          {otpSent && !verified && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 text-white py-2 rounded-md font-semibold hover:bg-gray-900 transition"
              >
                {loading ? "Verifying..." : "Verify OTP & Sign Up"}
              </button>
            </>
          )}

          {/* Success message */}
          {verified && (
            <p className="text-green-600 text-center font-semibold mt-2">
              Signup successful! Redirecting...
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() =>
              router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
            }
            className="text-yellow-500 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
