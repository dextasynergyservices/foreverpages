"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useOfflineStatus, useOfflineSync } from "@/contexts/OfflineContext";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function OfflineIndicator({
  className,
  showDetails = false,
  compact = false,
}: OfflineIndicatorProps) {
  const { isOnline, networkStatus, pendingActionsCount } = useOfflineStatus();
  const { isSyncing, lastSyncResult } = useOfflineSync();
  const { t } = useTranslations();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        {pendingActionsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {pendingActionsCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">
              {t("offline.status.online", {}, "Online")}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">
              {t("offline.status.offline", {}, "Offline")}
            </span>
          </>
        )}

        {networkStatus.connectionType && networkStatus.connectionType !== "unknown" && (
          <Badge variant="outline" className="text-xs">
            {networkStatus.connectionType}
          </Badge>
        )}
      </div>

      {/* Sync Status */}
      {isSyncing && (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-700 dark:text-blue-400">
            {t("offline.status.syncing", {}, "Syncing...")}
          </span>
        </div>
      )}

      {/* Pending Actions */}
      {pendingActionsCount > 0 && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-700 dark:text-amber-400">
            {t(
              "offline.pendingActions",
              { count: pendingActionsCount },
              `${pendingActionsCount} pending action${pendingActionsCount !== 1 ? "s" : ""}`
            )}
          </span>
        </div>
      )}

      {/* Last Sync Result */}
      {showDetails && lastSyncResult && (
        <Alert
          className={cn(
            lastSyncResult.success
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          )}
        >
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t(
              "offline.lastSync",
              {
                synced: lastSyncResult.syncedCount,
                failed: lastSyncResult.failedCount,
              },
              `Last sync: ${lastSyncResult.syncedCount} synced, ${lastSyncResult.failedCount} failed`
            )}
            {lastSyncResult.errors.length > 0 && (
              <div className="mt-1 text-xs opacity-75">
                {lastSyncResult.errors.slice(0, 2).join("; ")}
                {lastSyncResult.errors.length > 2 && "..."}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Sync Progress Component
interface SyncProgressProps {
  className?: string;
}

export function SyncProgress({ className }: SyncProgressProps) {
  const { isSyncing, lastSyncResult } = useOfflineSync();
  const { t } = useTranslations();

  if (!isSyncing && !lastSyncResult) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {isSyncing && (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm">
            {t("offline.syncProgress.synchronizing", {}, "Synchronizing data...")}
          </span>
        </div>
      )}

      {lastSyncResult && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("offline.syncProgress.title", {}, "Sync Progress")}</span>
            <span>
              {lastSyncResult.syncedCount + lastSyncResult.failedCount > 0
                ? `${lastSyncResult.syncedCount}/${lastSyncResult.syncedCount + lastSyncResult.failedCount}`
                : t("offline.syncProgress.complete", {}, "Complete")}
            </span>
          </div>
          <Progress
            value={lastSyncResult.syncedCount + lastSyncResult.failedCount > 0 ? 100 : 0}
            className="h-2"
          />
        </div>
      )}
    </div>
  );
}

// Offline Banner Component
interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, pendingActionsCount } = useOfflineStatus();
  const { t } = useTranslations();

  if (isOnline) return null;

  return (
    <Alert
      className={cn(
        "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
        className
      )}
    >
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        {t("offline.banner.offlineMessage", {}, "You're currently offline.")}{" "}
        {pendingActionsCount > 0 && (
          <span>{t("offline.banner.pendingActions", { count: pendingActionsCount })}</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
