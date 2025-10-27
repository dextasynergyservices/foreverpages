"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  size = "md",
  // variant = "default",
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // During SSR, always render the light theme icon to prevent hydration mismatch
  const displayTheme = isHydrated ? theme : "light";

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconSize = sizeClasses[size];

  return (
    <button aria-label="Toggle theme" onClick={toggleTheme} className={className}>
      {displayTheme === "dark" ? <Sun className={iconSize} /> : <Moon className={iconSize} />}
    </button>
  );
};
