import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ----------------------
// Helper: get userId from JWT cookie
// ----------------------
function getUserIdFromToken(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

// ------------------
// Pincode validation (6-digit India) + optional India Post lookup
// ------------------
async function validatePincode(pincode: string) {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return { valid: false };

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const office = data[0].PostOffice[0];
      return { valid: true, city: office.District, state: office.State };
    }

    return { valid: true }; // fallback if API returns nothing
  } catch (err) {
    console.warn("Pincode API failed, falling back:", err);
    return { valid: true };
  }
}

// ------------------
// GET: Fetch all addresses for the logged-in user
// ------------------
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, addresses: [] }, { status: 401 });

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ success: true, addresses });
  } catch (err: any) {
    console.error("Error fetching addresses:", err);
    return NextResponse.json({ success: false, addresses: [], error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------
// POST: Create new address
// ------------------
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { type, name, phone, doorNumber, street, landmark, city, state, pincode, isDefault } = body;

    if (!type || !name || !phone || !doorNumber || !street || !pincode) {
      return NextResponse.json({ success: false, error: "All required fields must be filled" }, { status: 400 });
    }

    const validation = await validatePincode(pincode);
    if (!validation.valid) return NextResponse.json({ success: false, error: "Invalid pincode" }, { status: 400 });

    const finalCity = city || validation.city || "";
    const finalState = state || validation.state || "";

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        type,
        name,
        phone,
        doorNumber,
        street,
        landmark: landmark || "",
        city: finalCity,
        state: finalState,
        pincode,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (err: any) {
    console.error("Error saving address:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------
// PUT: Update an address
// ------------------
export async function PUT(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, type, name, phone, doorNumber, street, landmark, city, state, pincode, isDefault } = body;

    if (!id) return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });

    const validation = await validatePincode(pincode);
    if (!validation.valid) return NextResponse.json({ success: false, error: "Invalid pincode" }, { status: 400 });

    const finalCity = city || validation.city || "";
    const finalState = state || validation.state || "";

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        type,
        name,
        phone,
        doorNumber,
        street,
        landmark: landmark || "",
        city: finalCity,
        state: finalState,
        pincode,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (err: any) {
    console.error("Error updating address:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}

// ------------------
// DELETE: Remove an address
// ------------------
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting address:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}
