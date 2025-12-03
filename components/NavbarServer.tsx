// components/NavbarServer.tsx
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export default async function NavbarServer() {
  const cookieStore = await cookies(); // ⭐ FIXED
  const token = cookieStore.get("token")?.value;

  let user: any = null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      user = { name: payload?.name || payload?.email || payload?.phone };
    } catch {
      user = null;
    }
  }

  return (
    <nav className="w-full p-4 bg-white shadow">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="font-bold">BSCFASHION</div>
        <div>
          {user ? (
            <div>Welcome, {user.name}</div>
          ) : (
            <a href="/login" className="text-yellow-500">Login</a>
          )}
        </div>
      </div>
    </nav>
  );
}
