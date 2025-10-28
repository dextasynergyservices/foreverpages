"use client";

import dynamic from "next/dynamic";

// Client-only Navbar with proper dynamic import
export const ClientNavbar = dynamic(
  () => import("./Navbar").then((mod) => ({ default: mod.Navbar })),
  {
    loading: () => <div className="h-16 bg-transparent" />,
    ssr: false,
  }
);
