"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { MemorialExpiryCheck } from "@/lib/utils/checkMemorialExpiry";

interface ExpiredMemorialBannerProps {
  expiryCheck: MemorialExpiryCheck;
  isOwner: boolean;
  memorialName?: string;
}

/**
 * Banner displayed on expired or grace period memorials
 * Shows different messages for owners vs public viewers
 */
export const ExpiredMemorialBanner: React.FC<ExpiredMemorialBannerProps> = ({
  expiryCheck,
  isOwner,
  memorialName,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();

  const bgColor =
    expiryCheck.reason === "expired"
      ? theme === "dark"
        ? "bg-red-900/20"
        : "bg-red-50"
      : expiryCheck.reason === "grace_period"
        ? theme === "dark"
          ? "bg-yellow-900/20"
          : "bg-yellow-50"
        : theme === "dark"
          ? "bg-orange-900/20"
          : "bg-orange-50";

  const borderColor =
    expiryCheck.reason === "expired"
      ? theme === "dark"
        ? "border-red-700"
        : "border-red-300"
      : expiryCheck.reason === "grace_period"
        ? theme === "dark"
          ? "border-yellow-700"
          : "border-yellow-300"
        : theme === "dark"
          ? "border-orange-700"
          : "border-orange-300";

  const textColor =
    expiryCheck.reason === "expired"
      ? theme === "dark"
        ? "text-red-400"
        : "text-red-700"
      : expiryCheck.reason === "grace_period"
        ? theme === "dark"
          ? "text-yellow-400"
          : "text-yellow-700"
        : theme === "dark"
          ? "text-orange-400"
          : "text-orange-700";

  const handleRenewClick = () => {
    router.push("/user-dashboard?section=subscription");
  };

  // Different messages for different expiry states
  const getMessage = () => {
    if (expiryCheck.reason === "expired") {
      if (isOwner) {
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: t("memorial.expiry.owner.expired.title", {}, "Subscription Expired"),
          description: t(
            "memorial.expiry.owner.expired.description",
            {},
            "This memorial is currently unavailable to the public. Renew your subscription to restore access."
          ),
          showRenewButton: true,
        };
      } else {
        return {
          icon: <Clock className="h-5 w-5" />,
          title: t("memorial.expiry.public.expired.title", {}, "Memorial Temporarily Unavailable"),
          description: t(
            "memorial.expiry.public.expired.description",
            {
              name: memorialName || t("common.memorial", {}, "this memorial"),
            },
            "The subscription for {{name}} has expired. Please contact the page owner to restore access."
          ),
          showRenewButton: false,
        };
      }
    } else if (expiryCheck.reason === "grace_period") {
      const daysLeft = expiryCheck.gracePeriodEnd
        ? Math.ceil(
            (new Date(expiryCheck.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        icon: <Clock className="h-5 w-5" />,
        title: t("memorial.expiry.gracePeriod.title", {}, "Subscription in Grace Period"),
        description: t(
          "memorial.expiry.gracePeriod.description",
          { days: daysLeft },
          "This memorial will become unavailable in {{days}} day(s). Renew your subscription to maintain access."
        ),
        showRenewButton: isOwner,
      };
    } else if (expiryCheck.reason === "owner_preview") {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        title: t("memorial.expiry.ownerPreview.title", {}, "Preview Mode - Subscription Expired"),
        description: t(
          "memorial.expiry.ownerPreview.description",
          {},
          "Only you can see this memorial. Renew your subscription to make it publicly accessible again."
        ),
        showRenewButton: true,
      };
    }
  };

  const message = getMessage();

  if (!message) return null;

  return (
    <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-4 mb-6`} role="alert">
      <div className="flex items-start gap-3">
        <div className={textColor}>{message.icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>{message.title}</h3>
          <p className={`text-sm ${textColor} opacity-90 mb-3`}>{message.description}</p>
          {message.showRenewButton && (
            <Button
              onClick={handleRenewClick}
              size="sm"
              className="gap-2"
              variant={expiryCheck.reason === "expired" ? "destructive" : "default"}
            >
              <RefreshCw className="h-4 w-4" />
              {t("memorial.expiry.renewButton", {}, "Renew Subscription")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
