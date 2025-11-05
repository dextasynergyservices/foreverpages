"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";
import DashboardLayout from "@/components/userDashboard/DashboardLayout";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslations();

  React.useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/auth/login?redirect=/user-dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("common.loading")}</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
