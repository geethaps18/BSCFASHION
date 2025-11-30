import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Your Prisma client
import { randomInt } from "crypto";

// OTP expiry time (10 minutes)
const OTP_EXPIRE_MINUTES = 10;

// Helper: generate 6-digit OTP
function generateOtp() {
  return String(randomInt(100000, 999999));
}

export async function POST(req: NextRequest) {
  try {
    const { contact, deliveryBoyId } = await req.json();

    if (!contact) {
      return NextResponse.json({ error: "Contact is required" }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    if (deliveryBoyId) {
      // OTP for customer delivery (DEV only: return OTP)
      return NextResponse.json({ message: "OTP sent to customer ✅", otp });
    } else {
      // === Delivery boy login/signup OTP ===
      let deliveryBoy = await prisma.deliveryBoy.findUnique({
        where: { phone: contact },
      });

      if (!deliveryBoy) {
        // Auto-create delivery boy for DEV testing
        deliveryBoy = await prisma.deliveryBoy.create({
          data: { name: "Test Delivery Boy", phone: contact },
        });
      }

      // Save OTP in delivery boy record
     const updatedDeliveryBoy = await prisma.deliveryBoy.update({
  where: { id: deliveryBoy.id },
  data: { otp, otpExpiresAt: expiresAt },
});

return NextResponse.json({
  message: "OTP sent ✅",
  otp: updatedDeliveryBoy.otp, // <- DEV OTP
  deliveryBoyId: updatedDeliveryBoy.id,
});

    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
