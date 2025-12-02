// Global fix for Next.js 15 route handler param typing
import "next/server";

declare module "next/server" {
  interface NextRouteHandlerContext {
    params: Record<string, string>;
  }
}
