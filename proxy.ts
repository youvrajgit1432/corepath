/**
 * CorePath — Clerk Proxy (Next.js 16)
 *
 * Protects routes based on authentication status.
 * Gracefully handles missing Clerk configuration so the site
 * still loads even when env vars haven't been set on Vercel yet.
 */

function createPassthrough() {
  return () => new Response(null, { status: 200 });
}

function createClerkHandler() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");

    const protectedRoutes = createRouteMatcher([
      "/dashboard(.*)",
      "/journey(.*)",
      "/workspace(.*)",
      "/command-center(.*)",
      "/admin(.*)",
    ]);

    return clerkMiddleware(async (auth: any, req: Request) => {
      if (protectedRoutes(req)) {
        await auth.protect();
      }
    });
  } catch (err) {
    console.warn(
      "[Clerk Proxy] Failed to initialize Clerk middleware:",
      err
    );
    return createPassthrough();
  }
}

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const handler = isClerkConfigured ? createClerkHandler() : createPassthrough();

export default handler;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|og-image.png).*)",
  ],
};
