"use client";

import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface OfflineProviderProps {
  children: ReactNode;
}

// Dynamically import the actual OfflineProvider to avoid SSR issues
const BaseOfflineProvider = dynamic(
  () => import("@/contexts/OfflineContext").then((mod) => mod.OfflineProvider),
  {
    ssr: false,
    loading: () => null,
  }
);

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR or before hydration, render children without the provider
  if (!isClient) {
    return <>{children}</>;
  }

  return <BaseOfflineProvider>{children}</BaseOfflineProvider>;
}
