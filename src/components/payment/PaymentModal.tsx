"use client";

import dynamic from "next/dynamic";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import Modal from "@/components/ui/modal";
import TermsAndConditions from "@/components/terms-and-conditions";
import type { Plan } from "@/hooks/usePlans";
import type { Currency } from "@/components/CurrencySelector";

// Dynamically import PaystackButton with no SSR to avoid "window is not defined" error
const PaystackButton = dynamic(() => import("./PaystackButton"), {
  ssr: false,
  loading: () => <Button disabled>Loading...</Button>,
});

/**
 * Extended Plan interface with currency display
 */
export interface PlanWithCurrency extends Plan {
  displayPrice: string;
  displayPriceNumeric: number;
  ngnEquivalent?: string;
  selectedCurrency: Currency;
}

interface PaymentModalProps {
  isOpen: boolean;
  selectedPlan: string | null;
  plans: PlanWithCurrency[];
  termsAgreed: boolean;
  onClose: () => void;
  onTermsAgree: (agreed: boolean) => void;
}

/**
 * PaymentModal Component
 *
 * Displays plan details with currency-aware pricing before payment
 *
 * Features:
 * - Shows plan details (name, description, duration)
 * - Displays price in selected currency + NGN equivalent
 * - Lists all plan features with checkmarks
 * - Terms & Conditions checkbox
 * - "Proceed to Payment" button (disabled until T&C accepted)
 *
 * @example
 * ```tsx
 * <PaymentModal
 *   isOpen={showModal}
 *   selectedPlan="premium"
 *   plans={plansWithCurrency}
 *   termsAgreed={agreed}
 *   onClose={() => setShowModal(false)}
 *   onTermsAgree={setAgreed}
 *   onProceedToPayment={handlePayment}
 * />
 * ```
 */
export default function PaymentModal({
  isOpen,
  selectedPlan,
  plans,
  termsAgreed,
  onClose,
  onTermsAgree,
}: PaymentModalProps) {
  const { t } = useTranslations();

  const plan = plans.find((p) => p.slug === selectedPlan);
  if (!plan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${plan.name} ${t("pricing.modal.plan")}`}
      size="xl"
      overlayBlur={true}
    >
      <div className="p-6">
        {/* Plan Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
          <p className="text-lg mb-2 text-muted-foreground">{plan.description}</p>
          <p className="text-sm font-medium text-primary mb-4">
            {plan.durationDays} days of forever
          </p>

          {/* Price Display */}
          <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary/20">
            <div className="text-4xl font-bold text-primary mb-2">{plan.displayPrice}</div>

            {/* NGN Equivalent (shown for non-NGN currencies) */}
            {plan.ngnEquivalent && (
              <div className="text-sm text-muted-foreground">{plan.ngnEquivalent}</div>
            )}

            {/* Currency Badge */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full">
              <span className="text-xs font-medium text-primary">
                {plan.selectedCurrency === "NGN" && "Nigerian Naira"}
                {plan.selectedCurrency === "USD" && "US Dollar"}
                {plan.selectedCurrency === "GBP" && "British Pound"}
                {plan.selectedCurrency === "EUR" && "Euro"}
              </span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-foreground">
            {t("pricing.modal.featuresIncluded")}
          </h4>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {Object.values(plan.features).map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{feature as string}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Terms and Conditions Section */}
        <div className="mb-6 border-t pt-4">
          <h4 className="text-lg font-semibold mb-3 text-foreground">
            {t("pricing.modal.termsAndConditions")}
          </h4>
          <TermsAndConditions onAgree={onTermsAgree} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 font-semibold transition-all duration-300"
          >
            {t("common.cancel")}
          </Button>

          {/* Paystack Payment Button */}
          <PaystackButton
            planId={plan.slug}
            amount={plan.displayPriceNumeric}
            currency={plan.selectedCurrency}
            disabled={!termsAgreed}
            className={cn(
              "flex-1 font-semibold transition-all duration-300",
              termsAgreed
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "opacity-50 cursor-not-allowed"
            )}
            onSuccess={(reference) => {
              console.log("Payment successful:", reference);
              onClose();
            }}
            onClose={() => {
              console.log("Payment cancelled");
            }}
          >
            {t("pricing.modal.proceedToPayment")}
          </PaystackButton>
        </div>

        {/* Terms Agreement Warning */}
        {!termsAgreed && (
          <p className="text-sm text-center mt-3 text-destructive font-medium">
            {t("pricing.modal.agreeTermsMessage")}
          </p>
        )}
      </div>
    </Modal>
  );
}
