"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Check, Infinity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import Modal from "@/components/ui/modal";
import TermsAndConditions from "@/components/terms-and-conditions";
import type { Currency } from "@/components/CurrencySelector";
import type { RenewalData } from "@/hooks/useRenewals";

// Dynamically import PaystackButton with no SSR
const PaystackButton = dynamic(() => import("@/components/payment/PaystackButton"), {
  ssr: false,
  loading: () => <Button disabled>Loading...</Button>,
});

interface RenewalModalProps {
  isOpen: boolean;
  renewal: RenewalData | null;
  currency: Currency;
  subscriptionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * RenewalModal Component
 *
 * Displays Forever Access (Lifetime) renewal option before payment
 *
 * Features:
 * - Lifetime access branding with badge
 * - Price in selected currency + NGN equivalent
 * - Features list from RenewalTranslation
 * - Terms & Conditions checkbox
 * - Paystack payment integration
 */
export default function RenewalModal({
  isOpen,
  renewal,
  currency,
  subscriptionId,
  onClose,
  onSuccess,
}: RenewalModalProps) {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isInitializing] = useState(false);

  if (!renewal) return null;

  // Get price in selected currency
  const getPriceInCurrency = (curr: Currency): number => {
    switch (curr) {
      case "NGN":
        return Number(renewal.priceNGN);
      case "USD":
        return Number(renewal.priceUSD);
      case "GBP":
        return Number(renewal.priceGBP);
      case "EUR":
        return Number(renewal.priceEUR);
      default:
        return Number(renewal.priceNGN);
    }
  };

  const price = getPriceInCurrency(currency);
  const priceNGN = Number(renewal.priceNGN);

  // Format price display
  const formatPrice = (amount: number, curr: Currency): string => {
    const symbols: Record<Currency, string> = {
      NGN: "₦",
      USD: "$",
      GBP: "£",
      EUR: "€",
    };
    return `${symbols[curr]}${amount.toLocaleString()}`;
  };

  const displayPrice = formatPrice(price, currency);
  const ngnEquivalent = currency !== "NGN" ? `(≈ ₦${priceNGN.toLocaleString()})` : null;

  // Parse features from renewal data
  const features = renewal.features
    ? Object.values(renewal.features as Record<string, string>)
    : [
        "Unlimited access forever",
        "No more renewals or payments",
        "All future updates included",
        "Priority support",
        "Lifetime guarantee",
      ];

  const handlePaymentSuccess = (reference: string) => {
    console.log("Renewal payment successful:", reference);
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={renewal.name} size="xl" overlayBlur={true}>
      <div className="p-6">
        {/* Header with Lifetime Badge */}
        <div className="text-center mb-6">
          {/* Lifetime Badge */}
          {renewal.badgeText && (
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30">
              <Infinity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-bold text-purple-600 dark:text-purple-400 uppercase text-sm tracking-wide">
                {renewal.badgeText}
              </span>
              <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
          )}

          {/* Title and Description */}
          <h3
            className={cn(
              "text-3xl font-bold mb-3",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            {renewal.name}
          </h3>

          {renewal.description && (
            <p
              className={cn(
                "text-lg mb-4 max-w-2xl mx-auto",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}
            >
              {renewal.description}
            </p>
          )}

          {/* Price Display */}
          <div
            className={cn(
              "inline-block px-8 py-6 rounded-xl border-2 shadow-lg",
              theme === "dark"
                ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50"
                : "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300"
            )}
          >
            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
              {t("renewal.oneTimePayment", {}, "One-time Payment")}
            </div>
            <div className="text-5xl font-bold text-purple-700 dark:text-purple-300 mb-1">
              {displayPrice}
            </div>
            {ngnEquivalent && <div className="text-sm text-muted-foreground">{ngnEquivalent}</div>}
          </div>
        </div>

        {/* Features List */}
        <div className="mb-6">
          <h4
            className={cn(
              "text-lg font-bold mb-4 text-center",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            {t("renewal.whatYouGet", {}, "What You Get")}
          </h4>
          <div className="grid gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                )}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  )}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6 border-t pt-4">
          <h4
            className={cn(
              "text-lg font-semibold mb-3",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            {t("pricing.modal.termsAndConditions", {}, "Terms and Conditions")}
          </h4>
          <TermsAndConditions onAgree={setTermsAgreed} />
        </div>

        {/* Payment Button */}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1" disabled={isInitializing}>
            {t("common.cancel", {}, "Cancel")}
          </Button>

          <div className="flex-1">
            <PaystackButton
              amount={price}
              currency={currency}
              email={""} // Will be fetched from session in the button
              disabled={!termsAgreed || isInitializing}
              onSuccess={handlePaymentSuccess}
              onClose={() => console.log("Payment cancelled")}
              metadata={{
                renewalSlug: renewal.slug,
                subscriptionId,
                paymentType: "RENEWAL",
              }}
              className="w-full"
              renewalSlug={renewal.slug}
              subscriptionId={subscriptionId}
            >
              {isInitializing
                ? t("payment.initializing", {}, "Initializing...")
                : t("renewal.upgradeToLifetime", {}, "Upgrade to Lifetime Access")}
            </PaystackButton>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t("payment.securePayment", {}, "🔒 Secure payment powered by Paystack")}
          </p>
        </div>
      </div>
    </Modal>
  );
}
