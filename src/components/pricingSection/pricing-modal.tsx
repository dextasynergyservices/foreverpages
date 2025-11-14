"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import Modal from "@/components/ui/modal";
import TermsAndConditions from "@/components/terms-and-conditions";
import { Plan } from "@/hooks/usePlans";

interface PricingModalProps {
  isOpen: boolean;
  selectedPlan: string | null;
  plans: Plan[];
  termsAgreed: boolean;
  onClose: () => void;
  onTermsAgree: (agreed: boolean) => void;
  onProceedToPayment: () => void;
}

export default function PricingModal({
  isOpen,
  selectedPlan,
  plans,
  termsAgreed,
  onClose,
  onTermsAgree,
  onProceedToPayment,
}: PricingModalProps) {
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
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
          <p className="text-lg mb-2 text-muted-foreground">{plan.description}</p>
          <p className="text-sm font-medium text-primary mb-4">
            {plan.durationDays} days of forever
          </p>
          <div className="text-3xl font-bold p-4 rounded-lg bg-primary text-primary-foreground">
            ₦{parseInt(plan.priceNGN).toLocaleString()}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-foreground">
            {t("pricing.modal.featuresIncluded")}
          </h4>
          <ul className="space-y-2">
            {Object.values(plan.features).map((feature, index) => (
              <li key={index} className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0 text-foreground" />
                <span className="text-sm text-muted-foreground">{feature as string}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Terms and Conditions Section */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-foreground">
            {t("pricing.modal.termsAndConditions")}
          </h4>
          <TermsAndConditions onAgree={onTermsAgree} />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 font-semibold transition-all duration-300 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onProceedToPayment}
            disabled={!termsAgreed}
            className={cn(
              "flex-1 font-semibold transition-all duration-300",
              termsAgreed
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            {t("pricing.modal.proceedToPayment")}
          </Button>
        </div>

        {!termsAgreed && (
          <p className="text-sm text-center mt-3 text-destructive">
            {t("pricing.modal.agreeTermsMessage")}
          </p>
        )}
      </div>
    </Modal>
  );
}
