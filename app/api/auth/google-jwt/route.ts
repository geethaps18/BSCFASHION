import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      contact: user.email || user.phone || "",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "365d" }
  );

  return NextResponse.json({ token });
}
