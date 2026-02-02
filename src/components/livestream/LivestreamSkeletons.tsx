"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("animate-pulse bg-gray-200 dark:bg-gray-800 rounded", className)} />
);

/**
 * Skeleton loader for the livestream viewer page
 */
export function LivestreamViewerSkeleton() {
  return (
    <section className="relative w-full bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 bg-gray-700" />
              <Skeleton className="h-4 w-48 bg-gray-700" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20 rounded-full bg-gray-700" />
              <Skeleton className="h-10 w-32 rounded-full bg-gray-700" />
              <Skeleton className="h-8 w-28 rounded-full bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Video & Chat Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Video Player Skeleton */}
          <div className="lg:col-span-3">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                  <Skeleton className="h-4 w-40 mx-auto bg-gray-700" />
                </div>
              </div>
            </div>
            {/* Description Skeleton */}
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <Skeleton className="h-4 w-full bg-gray-700" />
              <Skeleton className="h-4 w-2/3 mt-2 bg-gray-700" />
            </div>
          </div>

          {/* Chat Panel Skeleton */}
          <div className="lg:col-span-1">
            <div className="h-[500px] bg-gray-900 rounded-lg p-4 flex flex-col">
              <Skeleton className="h-6 w-32 mb-4 bg-gray-700" />
              <div className="flex-1 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-20 bg-gray-700" />
                      <Skeleton className="h-4 w-full bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-4 bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton loader for the broadcaster control panel
 */
export function BroadcasterSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-gray-700" />
            <Skeleton className="h-4 w-64 bg-gray-700" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 bg-gray-700" />
            <Skeleton className="h-10 w-32 bg-red-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                  <p className="text-gray-400">Initializing camera...</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
              <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
              <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
              <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats Card */}
            <div className="bg-gray-800 rounded-lg p-4">
              <Skeleton className="h-5 w-24 mb-4 bg-gray-700" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                  <Skeleton className="h-3 w-12 mt-1 bg-gray-700" />
                </div>
                <div>
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                  <Skeleton className="h-3 w-12 mt-1 bg-gray-700" />
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-gray-800 rounded-lg p-4 h-80">
              <Skeleton className="h-5 w-20 mb-4 bg-gray-700" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
                    <Skeleton className="h-4 flex-1 bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for stream cards in the dashboard
 */
export function StreamCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for recording cards
 */
export function RecordingCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card animate-pulse">
          {/* Thumbnail */}
          <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-t-lg" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline loading indicator for actions
 */
export function ActionLoadingIndicator({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

/**
 * Connection status indicator with animation
 */
export function ConnectionStatusIndicator({
  status,
  className,
}: {
  status: "connecting" | "connected" | "disconnected" | "reconnecting";
  className?: string;
}) {
  const configs = {
    connecting: {
      color: "bg-yellow-500",
      text: "Connecting...",
      animate: true,
    },
    connected: {
      color: "bg-green-500",
      text: "Connected",
      animate: false,
    },
    disconnected: {
      color: "bg-red-500",
      text: "Disconnected",
      animate: false,
    },
    reconnecting: {
      color: "bg-yellow-500",
      text: "Reconnecting...",
      animate: true,
    },
  };

  const config = configs[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className={cn("h-2 w-2 rounded-full", config.color)} />
        {config.animate && (
          <div
            className={cn(
              "absolute inset-0 h-2 w-2 rounded-full animate-ping",
              config.color,
              "opacity-75"
            )}
          />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{config.text}</span>
    </div>
  );
}
