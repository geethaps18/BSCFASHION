import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/wishlist(.*)',
  '/checkout(.*)',
  '/cart(.*)',   // fixed space -> hyphen
  '/profile(.*)',
  '/buynow(.*)',
  '/reviews(.*)',
  '/about(.*)',
  '/shop now(.*)',
  '/account(.*)',
  '/categories(.*)',
  '/orders(.*)',
  '/store(.*)',

]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();  // ✅ await the auth() call

  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url });  // ✅ safe now
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
