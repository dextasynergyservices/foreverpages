"use client";

import { useSearchParams } from "next/navigation";
import Dashboard from "@/components/userDashboard/UserDashboard";
import { Suspense } from "react";

function UserDashboardContent() {
  const searchParams = useSearchParams();
  const activeSection = (searchParams?.get("section") as string | null) || "analytics";

  return <Dashboard activeSection={activeSection} />;
}

export default function UserDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
