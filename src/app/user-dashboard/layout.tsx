"use client";

import React from "react";
import DashboardLayout from "@/components/userDashboard/DashboardLayout";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
