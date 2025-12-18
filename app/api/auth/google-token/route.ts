import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET!,
    { expiresIn: "365d" }
  );

  return NextResponse.json({ token });
}
