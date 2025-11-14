"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import {
  useSubscription,
  getAlertColors,
  formatExpirationDate,
  calculateProgress,
} from "@/hooks/useSubscription";
import { useRenewals } from "@/hooks/useRenewals";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Infinity } from "lucide-react";
import RenewalModal from "@/components/payment/RenewalModal";
import type { Currency } from "@/components/CurrencySelector";

export function SubscriptionCard() {
  const { data, isLoading, error } = useSubscription();
  const { data: renewals, isLoading: renewalsLoading } = useRenewals();
  const { t, locale } = useTranslations();
  const { theme } = useTheme();
  const router = useRouter();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedCurrency] = useState<Currency>("NGN"); // TODO: Get from user preference

  if (isLoading) {
    return (
      <div className="w-full p-6 border rounded-lg bg-white dark:bg-black border-gray-200 dark:border-white/10">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (error || !data?.success || !data?.data) {
    return (
      <div className="w-full p-6 border rounded-lg bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              {t("subscription.errorTitle", {}, "Unable to load subscription")}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {t("subscription.errorMessage", {}, "Please refresh the page or contact support.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const subscriptionData = data.data;
  const colors = getAlertColors(subscriptionData.alertLevel);

  // Get first renewal option (Forever Access)
  const renewal = renewals && renewals.length > 0 ? renewals[0] : null;

  // Handle renewal button click
  const handleRenewClick = () => {
    if (renewal && subscriptionData.subscription?.id) {
      setShowRenewalModal(true);
    } else {
      // Fallback to packages page if no renewal data
      router.push("/packages");
    }
  };

  // Handle successful renewal
  const handleRenewalSuccess = () => {
    setShowRenewalModal(false);
    // Refresh subscription data
    window.location.reload();
  };

  return (
    <>
      <div
        className={`w-full p-6 border rounded-lg transition-all duration-300 ${colors.bg} ${colors.border}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold ${colors.text}`}>
                {subscriptionData.plan?.nameKey
                  ? t(subscriptionData.plan.nameKey, {}, subscriptionData.plan?.name || "Your Plan")
                  : subscriptionData.plan?.name || t("subscription.plan", {}, "Your Plan")}
              </h2>

              {/* Lifetime Access Badge */}
              {subscriptionData.hasLifetimeAccess && subscriptionData.renewal && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700">
                  <Infinity className="w-3 h-3 inline mr-1" />
                  {subscriptionData.renewal.badgeText ||
                    t("subscription.status.lifetime", {}, "LIFETIME")}
                </span>
              )}

              {/* Regular Status Badge */}
              {!subscriptionData.hasLifetimeAccess && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                  {subscriptionData.alertLevel === "none" && (
                    <>
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      {subscriptionData.statusKey
                        ? t(subscriptionData.statusKey, {}, "Active")
                        : t("subscription.status.active", {}, "Active")}
                    </>
                  )}
                  {subscriptionData.alertLevel === "info" && (
                    <>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {t("subscription.status.expiringSoon", {}, "Expiring Soon")}
                    </>
                  )}
                  {subscriptionData.alertLevel === "warning" && (
                    <>
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {t("subscription.status.warning", {}, "Expires Soon")}
                    </>
                  )}
                  {subscriptionData.alertLevel === "critical" && (
                    <>
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {t("subscription.status.critical", {}, "Urgent")}
                    </>
                  )}
                  {subscriptionData.alertLevel === "grace" && (
                    <>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {t("subscription.status.grace", {}, "Grace Period")}
                    </>
                  )}
                  {subscriptionData.alertLevel === "expired" &&
                    t("subscription.status.expired", {}, "Expired")}
                </span>
              )}
            </div>
            <p className={`text-sm ${colors.text} opacity-80`}>
              {subscriptionData.plan?.descriptionKey
                ? t(
                    subscriptionData.plan.descriptionKey,
                    {},
                    subscriptionData.plan?.description || "Manage your subscription and billing"
                  )
                : subscriptionData.plan?.description ||
                  t("subscription.description", {}, "Manage your subscription and billing")}
            </p>
          </div>
        </div>

        {/* Lifetime Access Info */}
        {subscriptionData.hasLifetimeAccess && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Infinity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {t("subscription.lifetimeAccess", {}, "Lifetime Access Active")}
              </h3>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {t(
                "subscription.lifetimeMessage",
                {},
                "You have unlimited access to all features forever. No expiration, no renewals needed."
              )}
            </p>
          </div>
        )}

        {/* Days Remaining - Only show for non-lifetime subscriptions */}
        {!subscriptionData.hasLifetimeAccess &&
          subscriptionData.hasActiveSubscription &&
          subscriptionData.subscription && (
            <>
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`text-sm font-medium ${colors.text}`}>
                    {t("subscription.daysRemaining", {}, "Days Remaining")}
                  </span>
                  <span className={`text-3xl font-bold ${colors.text}`}>
                    {subscriptionData.daysRemaining}
                    <span className="text-base font-normal ml-2">
                      {t("subscription.days", {}, "days")}
                    </span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${colors.progress} h-full transition-all duration-500 ease-out`}
                    style={{
                      width: `${calculateProgress(subscriptionData.daysRemaining, subscriptionData.plan.durationDays)}%`,
                    }}
                  />
                </div>

                <p className={`text-xs mt-2 ${colors.text} opacity-70`}>
                  {t("subscription.expiresOn", {}, "Expires on")}{" "}
                  {formatExpirationDate(subscriptionData.subscription.expiresAt, locale)}
                </p>
              </div>

              {/* Alert Messages */}
              {subscriptionData.alertLevel === "warning" && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    {t(
                      "subscription.alert.warning",
                      {},
                      "Your subscription expires in 7 days. Renew now to avoid service interruption."
                    )}
                  </p>
                </div>
              )}

              {subscriptionData.alertLevel === "critical" && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    {t(
                      "subscription.alert.critical",
                      {},
                      "⚠️ Critical: Your subscription expires in 3 days! Renew immediately to keep access."
                    )}
                  </p>
                </div>
              )}

              {subscriptionData.alertLevel === "grace" && (
                <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    {t(
                      "subscription.alert.grace",
                      {},
                      "⏰ Grace Period Active: Your subscription has expired, but you have {days} days to renew without losing access."
                    ).replace("{days}", String(subscriptionData.daysRemaining))}
                  </p>
                </div>
              )}

              {subscriptionData.alertLevel === "expired" && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t(
                      "subscription.alert.expired",
                      {},
                      "Your subscription has expired. Renew now to regain access to all features."
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {subscriptionData.shouldShowRenewButton && (
                  <button
                    onClick={handleRenewClick}
                    disabled={renewalsLoading}
                    className={`
                  px-6 py-2.5 rounded-lg font-semibold transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    subscriptionData.alertLevel === "critical" ||
                    subscriptionData.alertLevel === "expired"
                      ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  }
                `}
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    {renewalsLoading
                      ? t("subscription.loading", {}, "Loading...")
                      : t("subscription.renew", {}, "Renew Now")}
                  </button>
                )}

                <button
                  onClick={() => router.push("/packages")}
                  className={`
                px-6 py-2.5 rounded-lg font-semibold transition-all duration-200
                ${
                  theme === "dark"
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    : "bg-black/5 hover:bg-black/10 text-black border border-black/10"
                }
              `}
                >
                  {t("subscription.upgrade", {}, "Upgrade Plan")}
                </button>
              </div>
            </>
          )}

        {/* No Active Subscription */}
        {!subscriptionData.hasActiveSubscription && (
          <div className="text-center py-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("subscription.noActive", {}, "You don't have an active subscription.")}
            </p>
            <button
              onClick={() => router.push("/packages")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200"
            >
              {t("subscription.viewPlans", {}, "View Plans")}
            </button>
          </div>
        )}
      </div>

      {/* Renewal Modal */}
      {renewal && subscriptionData.subscription?.id && (
        <RenewalModal
          isOpen={showRenewalModal}
          renewal={renewal}
          currency={selectedCurrency}
          subscriptionId={subscriptionData.subscription.id}
          onClose={() => setShowRenewalModal(false)}
          onSuccess={handleRenewalSuccess}
        />
      )}
    </>
  );
}
