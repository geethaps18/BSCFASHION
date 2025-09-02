import Link from "next/link";

interface OrderSummaryProps {
  totalAmount: number;
}

export default function OrderSummary({ totalAmount }: OrderSummaryProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Display total amount */}
      
      <span className="text-lg ">Continue</span>
    </div>
  );
}
