// Shared color utilities for admin dashboard
// Using project's monochrome color scheme

export const adminColors = {
  // Primary accent (monochrome)
  primary: "text-gray-900 dark:text-gray-100",
  primaryBg: "bg-gray-900 dark:bg-gray-100",
  primaryBorder: "border-gray-900 dark:border-gray-100",

  // Focus states
  focus:
    "focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:focus:ring-gray-300",

  // Spinner/Loading
  spinner: "border-gray-900 dark:border-gray-100",

  // Interactive elements
  link: "text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300",

  // Status badges
  badge: {
    default: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  },

  // Icon colors
  icon: "text-gray-900 dark:text-gray-100",
};
