"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      setCustomer(data);
    }
    fetchData();
  }, [id]);

if (loading) {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
    </div>
  );
}


  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Customer Details</h1>

      {/* Basic Info */}
      <div className="p-6 bg-white shadow rounded-xl border">
        <h2 className="text-xl font-semibold mb-3">Profile</h2>
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Email:</strong> {customer.email}</p>
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Status:</strong> {customer.status}</p>
        <p><strong>Joined:</strong> {new Date(customer.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Address */}
      <div className="p-6 bg-white shadow rounded-xl border">
        <h2 className="text-xl font-semibold mb-3">Default Address</h2>
        <p>{customer.defaultAddress || "No address added"}</p>
      </div>

      {/* Account */}
      <div className="p-6 bg-white shadow rounded-xl border">
        <h2 className="text-xl font-semibold mb-3">Account Details</h2>
        <p><strong>Bank Name:</strong> {customer.bankName || "—"}</p>
        <p><strong>Account:</strong> {customer.accountNumber || "—"}</p>
        <p><strong>IFSC:</strong> {customer.ifsc || "—"}</p>
      </div>

      {/* Order History */}
      <div className="p-6 bg-white shadow rounded-xl border">
        <h2 className="text-xl font-semibold mb-3">Order History</h2>

        {customer.orders.length === 0 && (
          <p className="text-gray-500">No orders yet.</p>
        )}

        {customer.orders.map((o: any) => (
          <div key={o.id} className="border-b p-3">
            <p><strong>Order ID:</strong> {o.id}</p>
            <p><strong>Total Amount:</strong> ₹{o.totalAmount}</p>
            <p><strong>Status:</strong> {o.status}</p>
            <p><strong>Date:</strong> {new Date(o.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
