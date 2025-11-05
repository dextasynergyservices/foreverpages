"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOfflineStatus, useOfflineSync } from "@/contexts/OfflineContext";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

// Enhanced Skeleton Components for Offline States
interface OfflineSkeletonProps {
  className?: string;
  showOfflineIndicator?: boolean;
}

export function MemorialCardSkeleton({
  className,
  showOfflineIndicator = true,
}: OfflineSkeletonProps) {
  const { isOnline } = useOfflineStatus();
  const { t } = useTranslations();

  return (
    <Card className={cn("relative", className)}>
      {!isOnline && showOfflineIndicator && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
            {t("offline.loading.offline", {}, "Offline")}
          </Badge>
        </div>
      )}
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-32 w-full rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TributeCardSkeleton({
  className,
  showOfflineIndicator = true,
}: OfflineSkeletonProps) {
  const { isOnline } = useOfflineStatus();
  const { t } = useTranslations();

  return (
    <Card className={cn("relative", className)}>
      {!isOnline && showOfflineIndicator && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
            {t("offline.loading.offline", {}, "Offline")}
          </Badge>
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export function GalleryGridSkeleton({
  className,
  showOfflineIndicator = true,
}: OfflineSkeletonProps) {
  const { isOnline } = useOfflineStatus();
  const { t } = useTranslations();

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {!isOnline && showOfflineIndicator && (
        <div className="col-span-full mb-2">
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
            {t("offline.loading.viewingCached", {}, "Viewing cached images")}
          </Badge>
        </div>
      )}
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Offline-aware Loading States
interface OfflineAwareLoaderProps {
  isLoading: boolean;
  offlineContent?: React.ReactNode;
  onlineContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function OfflineAwareLoader({
  isLoading,
  offlineContent,
  onlineContent,
  children,
  className,
}: OfflineAwareLoaderProps) {
  const { isOnline } = useOfflineStatus();

  if (isLoading) {
    return <div className={className}>{isOnline ? onlineContent : offlineContent}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Sync-aware Button States
interface SyncAwareButtonProps {
  isLoading: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function SyncAwareButton({
  isLoading,
  onClick,
  children,
  disabled,
  className,
  variant = "default",
  ...props
}: SyncAwareButtonProps) {
  const { isOnline } = useOfflineStatus();
  const { isSyncing } = useOfflineSync();

  const isDisabled = disabled || isLoading || (!isOnline && !isSyncing);

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90":
            variant === "destructive",
          "border border-input hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "text-primary underline-offset-4 hover:underline": variant === "link",
        },
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!isOnline && !isSyncing && <span className="mr-2 text-xs">📱</span>}
      {children}
    </button>
  );
}

// Offline Queue Status
interface OfflineQueueStatusProps {
  className?: string;
}

export function OfflineQueueStatus({ className }: OfflineQueueStatusProps) {
  const { pendingActionsCount, isOnline } = useOfflineStatus();
  const { t } = useTranslations();

  if (pendingActionsCount === 0) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-amber-700 dark:text-amber-400">
          {t("offline.loading.actionsQueued", { count: pendingActionsCount })}
        </span>
      </div>
      {!isOnline && (
        <span className="text-muted-foreground">
          ({t("offline.loading.willSyncWhenOnline", {}, "will sync when online")})
        </span>
      )}
    </div>
  );
}

// Enhanced Form with Offline Support
interface OfflineFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}

export function OfflineForm({
  onSubmit,
  children,
  submitLabel = "Submit",
  className,
}: OfflineFormProps) {
  const { isOnline } = useOfflineStatus();
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData);
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      <div className="mt-4 flex items-center gap-2">
        <SyncAwareButton
          isLoading={isSubmitting}
          disabled={!isOnline && isSubmitting}
          onClick={() => {}} // Form will handle submit
        >
          {submitLabel}
        </SyncAwareButton>
        {!isOnline && (
          <span className="text-sm text-muted-foreground">
            {t("offline.loading.savedLocally", {}, "Will be saved locally and synced when online")}
          </span>
        )}
      </div>
    </form>
  );
}
