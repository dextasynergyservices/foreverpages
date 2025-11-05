"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)} />;
}

// Card Skeleton for memorial cards, pricing cards, etc.
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Text Skeleton for paragraphs and text content
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

// Image Skeleton for profile pictures, memorial images, etc.
export function ImageSkeleton({ className }: SkeletonProps) {
  return <Skeleton className={cn("aspect-square rounded-lg", className)} />;
}

// Avatar Skeleton for user avatars
export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />;
}

// Form Skeleton for form loading states
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

// Table Skeleton for data tables
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Memorial Card Skeleton for memorial pages grid
export function MemorialCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <Skeleton className="aspect-video w-full" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading Spinner Component
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Page Loading State
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-128 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard-specific skeleton components

// Stats Card Skeleton for Analytics dashboard
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Media Card Skeleton for Gallery
export function MediaCardSkeleton() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Tribute Card Skeleton for Tributes dashboard
export function TributeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Invitation Card Skeleton for Invitations dashboard
export function InvitationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Activity Item Skeleton for Analytics activity feed
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 py-3">
      <Skeleton className="h-2 w-2 rounded-full" />
      <div className="space-y-1 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// Chart Skeleton for Analytics charts
export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Public page skeleton components

// Login/Signup Form Skeleton
export function AuthFormSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Form skeleton */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-8">
          <div className="space-y-4">
            {/* Email/Phone field */}
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>

            {/* Password field */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Skeleton className="h-4 w-32" />
            </div>

            {/* reCAPTCHA placeholder */}
            <div className="flex justify-center">
              <Skeleton className="h-20 w-full max-w-xs" />
            </div>

            {/* Submit button */}
            <Skeleton className="h-12 w-full" />
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>

        {/* Bottom text */}
        <div className="mt-6 text-center">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}
