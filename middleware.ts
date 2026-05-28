/**
 * CorePath — Clerk Middleware
 *
 * Protects routes based on authentication status.
 * Redirects unauthenticated users to /sign-in.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const protectedRoutes = createRouteMatcher([
  "/dashboard(.*)",
  "/journey(.*)",
  "/workspace(.*)",
  "/command-center(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (protectedRoutes(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|og-image.png).*)",
  ],
};
