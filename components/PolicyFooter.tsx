export const dynamic = "force-dynamic";

export default function PolicyFooter() {
  return (
    <div className="lg:hidden w-full bg-white text-center pt-6 pb-20 border-t border-gray-200">
      <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600">
        <a href="/privacy-policy" className="hover:underline">
          Privacy Policy
        </a>
        <a href="/terms-and-conditions" className="hover:underline">
          Terms & Conditions
        </a>
        <a href="/refund-policy" className="hover:underline">
          Refund Policy
        </a>
        <a href="/shipping-policy" className="hover:underline">
          Shipping Policy
        </a>
      </div>

      <p className="text-[10px] text-gray-400 mt-2">
        © {new Date().getFullYear()} BSCFASHION. All rights reserved.
      </p>
    </div>
  );
}
