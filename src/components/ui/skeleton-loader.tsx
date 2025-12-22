import React from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
};

/**
 * Template card skeleton loader for Step 0
 */
export const TemplateCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
};

/**
 * Memorial card skeleton loader for Templates Tab
 */
export const MemorialCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid skeleton loader
 */
export const GridSkeleton: React.FC<{ count?: number; type?: "template" | "memorial" }> = ({
  count = 6,
  type = "template",
}) => {
  const SkeletonComponent = type === "template" ? TemplateCardSkeleton : MemorialCardSkeleton;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
};

/**
 * Spinner loader for inline loading states
 */
export const Spinner: React.FC<{ size?: "sm" | "md" | "lg"; className?: string }> = ({
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Shimmer effect for preview panels
 */
export const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn("relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg", className)}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
    </div>
  );
};
