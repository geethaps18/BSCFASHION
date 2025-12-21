"use client";

import { useNetwork } from "@/hook/useNetwork";

export default function OfflineBanner({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  const online = useNetwork();

  if (online) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      <div className="text-center px-6 max-w-sm">
        <div className="text-5xl mb-4">📡</div>

        <h2 className="text-lg font-semibold text-gray-800">
          No Internet Connection
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Please check your network and retry.
        </p>

        <button
          onClick={onRetry}
          className="mt-6 w-full py-3 rounded-md bg-black text-white text-sm font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
