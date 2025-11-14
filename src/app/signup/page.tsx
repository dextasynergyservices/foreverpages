import { redirect } from "next/navigation";

/**
 * Legacy Signup Route Redirect
 *
 * Redirects /signup to /auth/signup (the main signup page)
 * Preserves query parameters for payment flow
 */
export default function Page({ searchParams }: { searchParams: { payment?: string } }) {
  // Preserve payment parameter if present
  const queryParam = searchParams.payment ? `?payment=${searchParams.payment}` : "";
  redirect(`/auth/signup${queryParam}`);
}
