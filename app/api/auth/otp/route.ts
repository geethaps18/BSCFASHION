import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

interface RequestBody {
  name?: string;
  contact: string;
}

export async function POST(req: Request) {
  try {
    const { name, contact } = (await req.json()) as RequestBody;

    if (!contact) {
      return NextResponse.json(
        { error: "Contact (phone/email) is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone: contact },
    });

    // If user does not exist, create (signup)
    if (!user) {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for new users" },
          { status: 400 }
        );
      }
      user = await prisma.user.create({
        data: { name, phone: contact },
      });
    } else {
      // If user exists and name is provided, update name
      if (name && user.name !== name) {
        user = await prisma.user.update({
          where: { phone: contact },
          data: { name },
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phone: user.phone, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token, user });
  } catch (err: any) {
    console.error("Auth Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
