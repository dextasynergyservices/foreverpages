import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimitMiddleware } from "./lib/rate-limit";
import { paymentGuard } from "./middleware/payment-guard";

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
  const authRoutes = ["/api/auth"]; // NextAuth routes should not require authentication

  // 2FA login routes that need to be accessible during login (before session exists)
  const twoFactorLoginRoutes = ["/api/user/2fa/send-code", "/api/user/2fa/verify"];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isTwoFactorLoginRoute = twoFactorLoginRoutes.some((route) => pathname.startsWith(route));

  // Block public access to template development routes
  if (pathname.startsWith("/templates/")) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Restricted - ForeverPages</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            :root {
              --primary: oklch(0.205 0 0);
              --primary-foreground: oklch(0.985 0 0);
              --secondary: oklch(0.97 0 0);
              --secondary-foreground: oklch(0.205 0 0);
              --muted: oklch(0.97 0 0);
              --muted-foreground: oklch(0.556 0 0);
              --border: oklch(0.922 0 0);
              --background: oklch(1 0 0);
              --foreground: oklch(0.145 0 0);
              --card: oklch(1 0 0);
              --card-foreground: oklch(0.145 0 0);
              --accent: oklch(0.97 0 0);
              --accent-foreground: oklch(0.205 0 0);
              --radius: 0.625rem;
            }
            body {
              font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: oklch(var(--background));
              color: oklch(var(--foreground));
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 1.6;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 3rem 2rem;
              background: oklch(var(--card));
              border-radius: calc(var(--radius) + 4px);
              border: 1px solid oklch(var(--border));
              box-shadow: 0 20px 25px -5px oklch(var(--primary) / 0.1),
                          0 10px 10px -5px oklch(var(--primary) / 0.04);
              margin: 1rem;
            }
            .lock-icon {
              font-size: 3.5rem;
              margin-bottom: 1.5rem;
              color: oklch(var(--muted-foreground));
            }
            h1 {
              font-family: 'Playfair Display', serif;
              font-size: 2.25rem;
              margin-bottom: 1rem;
              font-weight: 600;
              color: oklch(var(--foreground));
              letter-spacing: -0.02em;
            }
            p {
              font-size: 1rem;
              margin-bottom: 2rem;
              color: oklch(var(--muted-foreground));
              line-height: 1.7;
            }
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0.75rem 1.5rem;
              background: oklch(var(--primary));
              color: oklch(var(--primary-foreground));
              text-decoration: none;
              border-radius: var(--radius);
              font-weight: 500;
              font-size: 0.875rem;
              transition: all 0.2s ease;
              border: 1px solid transparent;
            }
            .btn:hover {
              background: oklch(var(--primary) / 0.9);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px oklch(var(--primary) / 0.3);
            }
            .btn:focus {
              outline: 2px solid oklch(var(--ring));
              outline-offset: 2px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="lock-icon">🔒</div>
            <h1>Access Restricted</h1>
            <p>These memorial templates are currently under development and not publicly accessible. Please contact support if you need assistance.</p>
            <a href="/" class="btn">Return to Homepage</a>
          </div>
        </body>
      </html>`,
      {
        status: 403,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  // Get the JWT token from the request (skip for public routes, auth routes, and 2FA login routes)
  const token =
    !isPublicRoute && !isAuthRoute && !isTwoFactorLoginRoute
      ? await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      : null;

  if (!token && !isPublicRoute && !isAuthRoute && !isTwoFactorLoginRoute) {
    // For API routes, return JSON error instead of redirecting
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
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
  // BUT exclude 2FA login routes (they need to be accessible during login)
  if (
    !isTwoFactorLoginRoute &&
    (pathname.startsWith("/api/user/") ||
      pathname.startsWith("/user-dashboard/") ||
      pathname.startsWith("/api/memorials/") ||
      pathname.startsWith("/api/tributes/") ||
      pathname.startsWith("/api/invitations/") ||
      pathname.startsWith("/api/gallery/") ||
      pathname.startsWith("/api/analytics/"))
  ) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // Check if user has required role (default to 'user' role)
    const userRole = ((token.role as string) || "user").toLowerCase();

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
        "/api/user/", // Allow all user API routes
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
    "/templates/:path*", // Block public access to templates
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
