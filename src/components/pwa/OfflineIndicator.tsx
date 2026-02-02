"use client";

import { useEffect, useState } from "react";
import { WifiOff, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOffline } from "@/hooks/useOffline";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
  showCacheButton?: boolean;
  memorialSlug?: string;
}

export function OfflineIndicator({
  className,
  showCacheButton = false,
  memorialSlug,
}: OfflineIndicatorProps) {
  const { t } = useTranslations();
  const { isOnline, cacheCurrentPage, isMemorialCached } = useOffline();
  const [isCaching, setIsCaching] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  const isCached = memorialSlug ? isMemorialCached(memorialSlug) : false;

  // Show offline banner with animation
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else {
      // Hide with delay for smooth transition
      const timer = setTimeout(() => setShowOfflineBanner(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleCache = async () => {
    setIsCaching(true);
    await cacheCurrentPage();
    setIsCaching(false);
  };

  // Offline banner
  if (showOfflineBanner) {
    return (
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
          isOnline ? "-translate-y-full" : "translate-y-0",
          className
        )}
      >
        <div className="bg-amber-500 text-amber-950 px-4 py-2">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="h-4 w-4" />
            <span>{t("offline.banner.limitedFeatures")}</span>
          </div>
        </div>
      </div>
    );
  }

  // Cache button for memorial pages
  if (showCacheButton && memorialSlug && isOnline) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCache}
        disabled={isCaching || isCached}
        className={cn("gap-2", className)}
      >
        {isCached ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            {t("offline.saveForOffline.saved")}
          </>
        ) : isCaching ? (
          <>
            <Download className="h-4 w-4 animate-bounce" />
            {t("offline.saveForOffline.saving")}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {t("offline.saveForOffline.button")}
          </>
        )}
      </Button>
    );
  }

  return null;
}

// Compact offline status indicator
export function OfflineStatus({ className }: { className?: string }) {
  const { t } = useTranslations();
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div className={cn("flex items-center gap-1.5 text-amber-600", className)}>
      <WifiOff className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{t("offline.status.offline")}</span>
    </div>
  );
}

export default OfflineIndicator;
