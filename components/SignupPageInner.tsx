"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { setCookie } from "cookies-next";
import Link from "next/link";
import { signIn } from "next-auth/react";


export default function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const isEmailValid = (input: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  // ------------------------
  // SEND OTP (Email Only)
  // ------------------------
  const handleSendOtp = async () => {
    if (!name || !email) return toast.error("Enter your name & email");
    if (!isEmailValid(email)) return toast.error("Enter a valid email");

    setLoading(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact: email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent to email");
        setOtpSent(true);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (e) {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  // ------------------------
  // VERIFY OTP & SIGNUP
  // ------------------------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Enter OTP");

    setLoading(true);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signup: true,
          name,
          contact: email,
          otp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Save login token
        setCookie("token", data.token, {
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
        });

        toast.success("Signup successful!");
        setVerified(true);

        router.push(redirectTo);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        
        <div className="flex justify-center mb-4">
         <Link href="/">
  <img
    src="/images/logo.png"
    alt="BSCFashion Logo"
    className="w-40 h-40 object-contain cursor-pointer"
  />
</Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>

        <form onSubmit={handleSignup} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          {/* Email Input */}
          {!otpSent && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
          )}
           <button
   type="button"
   onClick={() => signIn("google")}
   className="w-full flex items-center justify-center gap-2 border py-2 rounded-md hover:bg-gray-100 mb-4"
 >
   <img src="/google.svg" alt="Google" className="w-5 h-5" />
   Continue with Google
 </button>

          {/* Send OTP */}
          {!otpSent && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-yellow-500 text-white py-2 rounded-md font-semibold"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          )}

          {/* OTP Input + Verify */}
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
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 text-white py-2 rounded-md font-semibold"
              >
                {loading ? "Verifying..." : "Verify OTP & Sign Up"}
              </button>
            </>
          )}

          {/* Success Message */}
          {verified && (
            <p className="text-green-600 text-center font-semibold">
              Signup successful! Redirecting...
            </p>
          )}
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() =>
              router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
            }
            className="text-yellow-500 font-semibold"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
