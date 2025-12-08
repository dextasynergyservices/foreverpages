import React from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { useRouter } from "next/navigation";

export interface SubscriptionBannerProps {
  status: "ACTIVE" | "GRACE_PERIOD" | "EXPIRED" | string;
  alertLevel: "none" | "info" | "warning" | "critical" | "grace" | "expired" | string;
  daysRemaining?: number;
  expiresAt?: string;
  onRenewClick?: () => void;
}

/**
 * Banner component showing subscription status and warnings
 * Displayed at top of CreateMemorial to inform users of subscription status
 */
export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  status,
  alertLevel,
  daysRemaining,
  onRenewClick,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();

  // Color schemes for different alert levels
  const getColors = () => {
    switch (alertLevel) {
      case "grace":
        return {
          bg: theme === "dark" ? "bg-orange-900/20" : "bg-orange-50",
          border: theme === "dark" ? "border-orange-700" : "border-orange-200",
          icon: "text-orange-600 dark:text-orange-400",
          text: "text-orange-900 dark:text-orange-100",
          button: "bg-orange-600 hover:bg-orange-700",
        };
      case "critical":
        return {
          bg: theme === "dark" ? "bg-red-900/20" : "bg-red-50",
          border: theme === "dark" ? "border-red-700" : "border-red-200",
          icon: "text-red-600 dark:text-red-400",
          text: "text-red-900 dark:text-red-100",
          button: "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          bg: theme === "dark" ? "bg-yellow-900/20" : "bg-yellow-50",
          border: theme === "dark" ? "border-yellow-700" : "border-yellow-200",
          icon: "text-yellow-600 dark:text-yellow-400",
          text: "text-yellow-900 dark:text-yellow-100",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "expired":
        return {
          bg: theme === "dark" ? "bg-gray-900/20" : "bg-gray-50",
          border: theme === "dark" ? "border-gray-700" : "border-gray-200",
          icon: "text-gray-600 dark:text-gray-400",
          text: "text-gray-900 dark:text-gray-100",
          button: "bg-gray-600 hover:bg-gray-700",
        };
      default:
        return {
          bg: theme === "dark" ? "bg-green-900/20" : "bg-green-50",
          border: theme === "dark" ? "border-green-700" : "border-green-200",
          icon: "text-green-600 dark:text-green-400",
          text: "text-green-900 dark:text-green-100",
          button: "bg-green-600 hover:bg-green-700",
        };
    }
  };

  const colors = getColors();

  // Don't show banner for active subscriptions
  if (status === "ACTIVE" && alertLevel === "none") {
    return null;
  }

  // Handle renewal navigation
  const handleRenew = () => {
    if (onRenewClick) {
      onRenewClick();
    } else {
      router.push("/user-dashboard?section=subscription");
    }
  };

  // Render appropriate message based on status
  const renderMessage = () => {
    switch (status) {
      case "GRACE_PERIOD":
        return (
          <div className="flex items-start gap-3">
            <Clock className={`h-5 w-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`font-semibold ${colors.text}`}>
                {t("subscription.banner.gracePeriod.title", {}, "Subscription Expiring Soon")}
              </h3>
              <p className={`text-sm mt-1 ${colors.text}`}>
                {t(
                  "subscription.banner.gracePeriod.message",
                  { days: daysRemaining || 0 },
                  `Your subscription expires in ${daysRemaining || 0} days. Renew now to continue creating memorials.`
                )}
              </p>
            </div>
          </div>
        );
      case "EXPIRED":
        return (
          <div className="flex items-start gap-3">
            <AlertCircle className={`h-5 w-5 ${colors.icon} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`font-semibold ${colors.text}`}>
                {t("subscription.banner.expired.title", {}, "Subscription Expired")}
              </h3>
              <p className={`text-sm mt-1 ${colors.text}`}>
                {t(
                  "subscription.banner.expired.message",
                  {},
                  "Your subscription has expired. Please renew to create and publish memorials."
                )}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">{renderMessage()}</div>
        {(status === "GRACE_PERIOD" || status === "EXPIRED") && (
          <Button
            onClick={handleRenew}
            className={`${colors.button} text-white flex-shrink-0`}
            size="sm"
          >
            {t("subscription.banner.renewButton", {}, "Renew")}
          </Button>
        )}
      </div>
    </div>
  );
};
