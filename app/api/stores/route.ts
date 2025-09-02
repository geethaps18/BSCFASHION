import { NextResponse } from "next/server";

const STORES = [
  {
    id: "1",
    name: "BSCFASHION Davanagere",
    address: "123 Main Street",
    city: "Davanagere",
    state: "Karnataka",
    pincode: "577001",
    phone: "1234567890",
    email: "dvg@bscfashion.com",
    timings: "10 AM - 8 PM",
    lat: 14.4646,
    lng: 75.9215,
  },
  {
    id: "2",
    name: "BSCFASHION Bangalore",
    address: "456 MG Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    phone: "9876543210",
    email: "blr@bscfashion.com",
    timings: "10 AM - 9 PM",
    lat: 12.9716,
    lng: 77.5946,
  },
  // Add more stores
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";

  const filtered = STORES.filter(
    (store) =>
      store.city.toLowerCase().includes(search) ||
      store.state.toLowerCase().includes(search) ||
      store.pincode.includes(search)
  );

  return NextResponse.json({ success: true, stores: filtered });
}
