// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      let existingUser = await prisma.user.findFirst({
        where: { email: user.email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || "Google User",
            phone: "",
            blocked: false,
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.email) {
        (session.user as any).email = token.email;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
