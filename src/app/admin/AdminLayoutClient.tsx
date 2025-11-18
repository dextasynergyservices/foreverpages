"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Mail,
  Activity,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Video,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { signOut } from "next-auth/react";

interface AdminLayoutClientProps {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  userName,
  userRole,
  children,
}: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Handle admin logout
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen transform border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <Link
              href="/admin"
              className={`flex items-center space-x-2 ${sidebarCollapsed ? "lg:justify-center" : ""}`}
            >
              <LayoutDashboard className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <span
                className={`text-xl font-bold text-gray-900 dark:text-white transition-opacity ${sidebarCollapsed ? "lg:hidden" : ""}`}
              >
                Admin Panel
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <NavLink
              href="/admin"
              icon={<LayoutDashboard className="h-5 w-5" />}
              active={pathname === "/admin"}
              collapsed={sidebarCollapsed}
            >
              Dashboard
            </NavLink>
            <NavLink
              href="/admin/signups"
              icon={<Users className="h-5 w-5" />}
              active={pathname === "/admin/signups"}
              collapsed={sidebarCollapsed}
            >
              Signups
            </NavLink>
            <NavLink
              href="/admin/payments"
              icon={<CreditCard className="h-5 w-5" />}
              active={pathname === "/admin/payments"}
              collapsed={sidebarCollapsed}
            >
              Payments
            </NavLink>
            <NavLink
              href="/admin/recordings"
              icon={<Video className="h-5 w-5" />}
              active={pathname === "/admin/recordings"}
              collapsed={sidebarCollapsed}
            >
              Recordings
            </NavLink>
            <NavLink
              href="/admin/emails"
              icon={<Mail className="h-5 w-5" />}
              active={pathname === "/admin/emails"}
              collapsed={sidebarCollapsed}
            >
              Email Logs
            </NavLink>
            <NavLink
              href="/admin/activity"
              icon={<Activity className="h-5 w-5" />}
              active={pathname === "/admin/activity"}
              collapsed={sidebarCollapsed}
            >
              Activity Logs
            </NavLink>
            <NavLink
              href="/admin/revoke"
              icon={<Shield className="h-5 w-5" />}
              active={pathname === "/admin/revoke"}
              collapsed={sidebarCollapsed}
            >
              Revocations
            </NavLink>
            <NavLink
              href="/admin/settings"
              icon={<Settings className="h-5 w-5" />}
              active={pathname === "/admin/settings"}
              collapsed={sidebarCollapsed}
            >
              Settings
            </NavLink>
          </nav>

          {/* Desktop collapse toggle */}
          <div className="hidden border-t border-gray-200 p-2 dark:border-gray-700 lg:block">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex w-full items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* User info */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div
              className={`flex items-center ${sidebarCollapsed ? "lg:justify-center" : "space-x-3"}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                {userName?.[0]?.toUpperCase() || "A"}
              </div>
              <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`mt-3 flex w-full items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 ${
                sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-center space-x-2"
              }`}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white lg:text-2xl">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Notification Bell */}
              <NotificationBell variant="compact" />
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
              <span className="hidden text-sm text-gray-500 dark:text-gray-400 lg:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
  active,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        collapsed ? "lg:justify-center" : "space-x-3"
      } ${
        active
          ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
      title={collapsed ? String(children) : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className={collapsed ? "lg:hidden" : ""}>{children}</span>
    </Link>
  );
}
