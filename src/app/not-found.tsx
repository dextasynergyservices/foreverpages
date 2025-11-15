"use client";

import Link from "next/link";
import { Heart, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-black">
      <div className="text-center">
        {/* Logo */}
        <Link href="/" className="inline-block mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-black shadow-lg transition-colors hover:bg-gray-800 dark:bg-white">
            <Heart className="h-10 w-10 fill-white text-white dark:fill-black dark:text-black" />
          </div>
        </Link>

        {/* 404 Text */}
        <h1 className="mb-4 text-8xl font-bold text-black dark:text-white">404</h1>

        {/* Message */}
        <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">Page Not Found</h2>
        <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Additional Links */}
        <div className="mt-12 text-sm text-gray-600 dark:text-gray-400">
          <p>Need help? Visit our</p>
          <div className="mt-2 flex justify-center space-x-4">
            <Link href="/packages" className="underline hover:text-black dark:hover:text-white">
              Packages
            </Link>
            <span>•</span>
            <Link href="/#contact" className="underline hover:text-black dark:hover:text-white">
              Contact
            </Link>
            <span>•</span>
            <Link href="/#faq" className="underline hover:text-black dark:hover:text-white">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
