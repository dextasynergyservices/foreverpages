import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { paymentGuard } from "@/middleware/payment-guard";

/**
 * Authentication middleware for protecting user-related and admin routes.
 *
 * - Only runs for the paths configured in `config.matcher` (see bottom).
 * - Checks for a valid NextAuth JWT token.
 * - Redirects unauthenticated requests to `/auth/login` and preserves the
 *   original path in the `redirect` query param.
 * - Implements role-based access control for user-related API endpoints.
 * - Provides strict admin-only access control for admin routes.
 *
 * Notes / assumptions:
 * - This project uses NextAuth with JWT strategy for sessions.
 * - The middleware checks for a valid JWT token (no DB lookup for Edge compatibility).
 * - Provides defense-in-depth protection alongside individual API route authentication.
 * - Admin routes require explicit "admin" role in the JWT token.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Delegate signup/payment checks to the centralized payment guard helper
  if (pathname === "/signup" || pathname === "/auth/signup") {
    const result = await paymentGuard(req);
    if (result) return result;
  }

  // Add no-cache headers for auth-related routes
  const noCacheRoutes = ["/api/auth", "/api/user/profile", "/login", "/logout", "/signup"];

  if (noCacheRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next();
    // Set aggressive no-cache headers for auth routes
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    // Continue with other middleware logic
  }

  // Apply rate limiting to auth endpoints
  const rateLimitResult = await rateLimitMiddleware(req);
  if (rateLimitResult.status === 429) {
    return rateLimitResult;
  }

  // Skip authentication check for certain public routes that are in the matcher
  const publicRoutes = ["/signup", "/auth/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Get the JWT token from the request (skip for public routes)
  const token = !isPublicRoute
    ? await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    : null;

  if (!token && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Special handling for admin routes - only admin role can access
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin/")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    const userRole = (token.role as string)?.toUpperCase() || "USER";

    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      // For API routes, return 403
      if (pathname.startsWith("/api/admin/")) {
        return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 });
      }
      // For admin pages, redirect to user dashboard
      const url = req.nextUrl.clone();
      url.pathname = "/user-dashboard";
      return NextResponse.redirect(url);
    }
    // Admin has full access, skip further checks
    return NextResponse.next();
  }

  // Role-based access control for user-related routes
  if (
    pathname.startsWith("/api/user/") ||
    pathname.startsWith("/user-dashboard/") ||
    pathname.startsWith("/api/memorials/") ||
    pathname.startsWith("/api/tributes/") ||
    pathname.startsWith("/api/invitations/") ||
    pathname.startsWith("/api/gallery/") ||
    pathname.startsWith("/api/analytics/")
  ) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // Check if user has required role (default to 'user' role)
    const userRole = (token.role as string) || "user";

    // Define role-based permissions
    const rolePermissions = {
      admin: ["*"], // Admin can access everything
      moderator: [
        "/api/user/",
        "/user-dashboard/",
        "/api/memorials/",
        "/api/tributes/",
        "/api/invitations/",
        "/api/gallery/",
        "/api/analytics/",
      ], // Moderator can access user routes
      user: [
        "/api/user/profile",
        "/user-dashboard/",
        "/api/memorials/",
        "/api/tributes/",
        "/api/invitations/",
        "/api/gallery/",
        "/api/analytics/",
      ], // Regular user permissions
    };

    const allowedPaths = rolePermissions[userRole as keyof typeof rolePermissions] || [];

    // Check if the user has permission for this path
    const hasPermission = allowedPaths.some(
      (allowedPath) => allowedPath === "*" || pathname.startsWith(allowedPath)
    );

    if (!hasPermission) {
      return NextResponse.json(
        { message: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }
  }

  // Allow the request to continue.
  return NextResponse.next();
}

// Only run this middleware for user-related routes and auth API routes.
// This includes dashboard routes and all user-related API endpoints.
export const config = {
  matcher: [
    "/signup", // Payment guard protection
    "/auth/signup", // Actual signup page (after redirect)
    "/user-dashboard/:path*",
    "/admin/:path*",
    "/api/user/:path*",
    "/api/auth/:path*",
    "/api/memorials/:path*",
    "/api/tributes/:path*",
    "/api/invitations/:path*",
    "/api/gallery/:path*",
    "/api/analytics/:path*",
    "/api/admin/:path*",
  ],
};
