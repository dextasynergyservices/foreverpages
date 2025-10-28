"use client";

import { useState, useEffect } from "react";
import { LoadingPage } from "@/components/LoadingPage";
import { useTheme } from "@/hooks/useTheme";

interface ClientPageWrapperProps {
  children: React.ReactNode;
}

export function ClientPageWrapper({ children }: ClientPageWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Reduced from 2.5s to 1s

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage onLoadingComplete={() => setIsLoading(false)} theme={theme} />;
  }

  return <>{children}</>;
}
