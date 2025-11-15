import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Payment Guard Middleware
 * Protects routes that require valid payment
 *
 * This middleware runs before the page loads to ensure users have completed payment
 * before accessing protected routes like /signup
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to signup route
  if (pathname === "/signup") {
    // Check if this is a collaborator signup (no payment required)
    const typeParam = request.nextUrl.searchParams.get("type");
    const invitationParam = request.nextUrl.searchParams.get("invitation");

    // Allow collaborators to signup without payment
    if (typeParam === "collaborator" && invitationParam) {
      return NextResponse.next();
    }

    // Check if payment reference exists in cookies or query params
    const paymentParam = request.nextUrl.searchParams.get("payment");
    const paymentCookie = request.cookies.get("paymentId")?.value;

    // Allow access if payment exists in either location
    if (paymentParam || paymentCookie) {
      return NextResponse.next();
    }

    // No payment found - redirect to packages page
    const packagesUrl = new URL("/packages", request.url);
    const response = NextResponse.redirect(packagesUrl);

    // Set a header to indicate why redirect happened (for debugging)
    response.headers.set("X-Redirect-Reason", "payment-required");

    return response;
  }

  return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    "/signup",
    // Add other routes that need payment protection
  ],
};
