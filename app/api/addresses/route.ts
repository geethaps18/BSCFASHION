import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ----------------------
// Types
// ----------------------
interface AddressBody {
  id?: string;
  type: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  doorNumber: string;
  street: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}

interface PincodeValidationResult {
  valid: boolean;
  city?: string;
  state?: string;
}

// ----------------------
// Helper: get userId from JWT cookie
// ----------------------
function getUserIdFromToken(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// ----------------------
// Pincode validation (6-digit India) + optional India Post lookup
// ----------------------
async function validatePincode(pincode: string): Promise<PincodeValidationResult> {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return { valid: false };

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = (await res.json()) as any[];

    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const office = data[0].PostOffice[0];
      return { valid: true, city: office.District, state: office.State };
    }

    return { valid: true };
  } catch (error) {
    console.warn("Pincode API failed, falling back:", error);
    return { valid: true };
  }
}

// ----------------------
// GET: Fetch all addresses
// ----------------------
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, addresses: [] }, { status: 401 });

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { success: false, addresses: [], error: (error as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// ----------------------
// POST: Create address
// ----------------------
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as AddressBody;

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
  } catch (error) {
    console.error("Error saving address:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// ----------------------
// PUT: Update address
// ----------------------
export async function PUT(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as AddressBody;

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
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Server error" },
      { status: 500 }
    );
  }
}

// ----------------------
// DELETE: Remove address
// ----------------------
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as { id?: string };
    const { id } = body;

    if (!id) return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Server error" },
      { status: 500 }
    );
  }
}
