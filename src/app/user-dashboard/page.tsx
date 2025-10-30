"use client";

import { useSearchParams } from "next/navigation";
import Dashboard from "@/components/userDashboard/UserDashboard";

export default function UserDashboard() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "analytics";

  return <Dashboard activeSection={activeSection} />;
}
