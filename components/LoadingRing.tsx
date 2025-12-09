"use client";

export default function LoadingRing() {
  return (
    <div className="flex justify-center py-10">
      <div className="loader"></div>

      <style jsx>{`
        .loader {
          width: 36px;
          height: 36px;
          border: 4px solid #f0f0f0;
          border-top-color: #fbbf24; /* gold/yellow */
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
