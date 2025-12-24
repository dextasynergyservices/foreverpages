export const dynamic = "force-dynamic";

import LoginPage from "@/components/Login";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: { redirect?: string } }) {
  // Check if user is already authenticated on the server
  const user = await getCurrentUser();

  if (user) {
    // User is already logged in, redirect them
    const redirectPath = searchParams?.redirect;
    if (redirectPath) {
      redirect(decodeURIComponent(redirectPath));
    } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      redirect("/admin");
    } else {
      redirect("/user-dashboard");
    }
  }

  return (
    <main>
      <LoginPage />
    </main>
  );
}
