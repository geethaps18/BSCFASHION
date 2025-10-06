"use client";
import { useState } from "react";

export default function OtpForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const sendOtp = async () => {
    const res = await fetch("/api/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.success) setStep("otp");
    else alert(data.error || "Failed to send OTP");
  };

  const verifyOtp = async () => {
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (data.success) {
      // Login / Signup
      const loginRes = await fetch("/api/auth/login-signup", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      const loginData = await loginRes.json();
      if (loginData.success) alert("Logged in successfully!");
      else alert(loginData.error);
    } else alert("Invalid OTP");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      {step === "phone" && (
        <>
          <input
            className="w-full border p-2 rounded mb-4"
            type="text"
            placeholder="Enter your phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
            onClick={sendOtp}
          >
            Send OTP
          </button>
        </>
      )}
      {step === "otp" && (
        <>
          <input
            className="w-full border p-2 rounded mb-4"
            type="text"
            placeholder="Enter OTP"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
            onClick={verifyOtp}
          >
            Verify OTP
          </button>
        </>
      )}
    </div>
  );
}
