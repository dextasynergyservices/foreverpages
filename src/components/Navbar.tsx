"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Heart, Menu, User, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLogout } from "@/hooks/useLogout";

export const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { logout, isLoggingOut } = useLogout();

  // Hydration safety
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      // Show background when scrolled more than 50px
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Use a consistent theme during SSR to prevent hydration mismatch
  const displayTheme = isHydrated ? theme : "light";

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (pathname === "/") {
      // If we're already on the homepage, just scroll to the section
      const element = document.getElementById("how-it-works");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If we're on a different page, navigate to homepage with hash
      window.location.assign("/#how-it-works");
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (pathname === "/") {
      // If we're already on the homepage, just scroll to the section
      const element = document.getElementById("contact");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If we're on a different page, navigate to homepage with hash
      window.location.assign("/#contact");
    }
  };

  const handleMobileHowItWorksClick = (e: React.MouseEvent) => {
    handleHowItWorksClick(e);
    setIsOpen(false);
  };

  const handleMobileContactClick = (e: React.MouseEvent) => {
    handleContactClick(e);
    setIsOpen(false);
  };
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 p-6 transition-all duration-500 ${
        isScrolled
          ? displayTheme === "dark"
            ? "bg-white backdrop-blur-md shadow-sm text-gray-900"
            : "bg-black backdrop-blur-md shadow-sm text-white"
          : "bg-transparent text-foreground"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Heart
            className={`h-8 w-8 transition-colors ${
              isScrolled ? "text-primary" : displayTheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          />
          <h1
            className={`text-2xl font-serif font-bold transition-colors ${
              isScrolled ? "" : displayTheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("navbar.logo")}
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.home")}
          </Link>

          <Link
            href="/memorial-pages"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.memorials")}
          </Link>

          <Link
            href="/#how-it-works"
            onClick={handleHowItWorksClick}
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.howItWorks")}
          </Link>
          <Link
            href="/#contact"
            onClick={handleContactClick}
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.support")}
          </Link>
          <LanguageSwitcher />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-full border transition-all duration-300 ${
                    isScrolled
                      ? displayTheme === "dark"
                        ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                        : "border-gray-600 bg-black text-white hover:bg-gray-900"
                      : displayTheme === "dark"
                        ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                        : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={displayTheme === "dark" ? "bg-transparent" : "bg-transparent"}
                    >
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{session.user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/user-dashboard" className="cursor-pointer flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>{t("navbar.buttons.dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? "Logging out..." : t("navbar.buttons.signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              className={`h-9 px-4 inline-flex items-center justify-center rounded-md border transition-all duration-300 whitespace-nowrap ${
                isScrolled
                  ? displayTheme === "dark"
                    ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                    : "border-gray-600 bg-black text-white hover:bg-gray-900"
                  : displayTheme === "dark"
                    ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                    : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
              }`}
              href="/auth/login"
            >
              {t("navbar.buttons.signIn")}
            </Link>
          )}
          <ThemeToggle
            className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
              isScrolled
                ? displayTheme === "dark"
                  ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                  : "border-gray-600 bg-black text-white hover:bg-gray-900"
                : displayTheme === "dark"
                  ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                  : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
            }`}
            size="md"
          />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
                  isScrolled
                    ? displayTheme === "dark"
                      ? "border-black bg-white text-black hover:bg-black/80"
                      : "border-white bg-black text-white hover:bg-white"
                    : displayTheme === "dark"
                      ? "border-white bg-transparent text-white hover:bg-white"
                      : "border-black bg-transparent text-black hover:bg-black/80"
                }`}
                // Provide a stable aria-controls/id pairing to avoid Radix auto-id
                // mismatches between server and client during hydration.
                aria-controls="mobile-sheet-content"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              // Explicit stable id for sheet content so aria-controls is deterministic
              id="mobile-sheet-content"
              side="right"
              className={`w-[300px] sm:w-[400px] transition-colors ${
                displayTheme === "dark"
                  ? "bg-white backdrop-blur-lg border-black text-black"
                  : "bg-black backdrop-blur-lg border-white text-white"
              }`}
            >
              {/* Add SheetHeader with visually hidden title for accessibility */}
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col space-y-6 mt-8">
                {/* Add the missing Home link */}
                <Link
                  href="/"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navbar.navigation.home")}
                </Link>

                {/* Add the missing Memorials link */}
                <Link
                  href="/memorial-pages"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navbar.navigation.memorials")}
                </Link>

                {/* Keep existing mobile links */}
                <Link
                  href="/#how-it-works"
                  onClick={handleMobileHowItWorksClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                >
                  {t("navbar.navigation.howItWorks")}
                </Link>

                {/* Fix: This should be #contact to match desktop */}
                <Link
                  href="/#contact"
                  onClick={handleMobileContactClick}
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                >
                  {t("navbar.navigation.support")}
                </Link>

                <div className="flex items-center gap-4">
                  <LanguageSwitcher />
                  <ThemeToggle
                    className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors ${
                      displayTheme === "dark"
                        ? "border-gray-300 text-gray-900 hover:bg-gray-100"
                        : "border-gray-600 text-white hover:bg-gray-900"
                    }`}
                    size="md"
                  />
                </div>

                {session ? (
                  <div className="flex flex-col space-y-3 pt-4 border-t border-gray-300 dark:border-gray-700">
                    <div className="text-sm font-semibold px-2">{session.user?.email}</div>
                    <Button
                      variant="memorial-outline"
                      size="xs"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/user-dashboard" onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t("navbar.buttons.dashboard")}
                      </Link>
                    </Button>
                    <Button
                      variant="memorial-outline"
                      size="xs"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? "Logging out..." : t("navbar.buttons.signOut")}
                    </Button>
                  </div>
                ) : (
                  <Button variant="memorial-outline" size="xs" className="w-full" asChild>
                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                      {t("navbar.buttons.signIn")}
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
