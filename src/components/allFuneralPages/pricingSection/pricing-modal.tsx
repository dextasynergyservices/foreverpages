"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import Modal from "@/components/ui/modal";
import TermsAndConditions from "@/components/terms-and-conditions";
import { plans } from "./pricing-data";

interface PricingModalProps {
  isOpen: boolean;
  selectedPlan: string | null;
  termsAgreed: boolean;
  onClose: () => void;
  onTermsAgree: (agreed: boolean) => void;
  onProceedToPayment: () => void;
}

export default function PricingModal({
  isOpen,
  selectedPlan,
  termsAgreed,
  onClose,
  onTermsAgree,
  onProceedToPayment,
}: PricingModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslations();

  const plan = plans.find((p) => p.id === selectedPlan);
  if (!plan) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t(`pricing.plans.${plan.id}.name`)} ${t("pricing.modal.plan")}`}
      size="xl"
      overlayBlur={true}
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <h3
            className={cn(
              "text-2xl font-bold mb-2",
              theme === "light" ? "text-black" : "text-white"
            )}
          >
            {t(`pricing.plans.${plan.id}.name`)}
          </h3>
          <p className={cn("text-lg mb-4", theme === "light" ? "text-gray-700" : "text-gray-300")}>
            {t(`pricing.plans.${plan.id}.description`)}
          </p>
          <div
            className={cn(
              "text-3xl font-bold p-4 rounded-lg",
              theme === "dark" ? "bg-white text-black" : "bg-black text-white"
            )}
          >
            ₦{plan.price}
            {plan.period && (
              <span
                className={cn(
                  "text-lg font-normal ml-1",
                  theme === "dark" ? "text-white" : "text-black"
                )}
              >
                {plan.period}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h4
            className={cn(
              "text-lg font-semibold mb-3",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            {t("pricing.modal.featuresIncluded")}
          </h4>
          <ul className="space-y-2">
            {Object.values(plan.features).map((feature, index) => (
              <li key={index} className="flex items-center">
                <Check
                  className={cn(
                    "w-5 h-5 mr-3 flex-shrink-0",
                    theme === "dark" ? "text-white" : "text-black"
                  )}
                />
                <span className={cn("text-sm", theme === "dark" ? "text-white" : "text-black")}>
                  {feature as string}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Terms and Conditions Section */}
        <div className="mb-6">
          <h4
            className={cn(
              "text-lg font-semibold mb-3",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            {t("pricing.modal.termsAndConditions")}
          </h4>
          <TermsAndConditions onAgree={onTermsAgree} />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className={cn(
              "flex-1 font-semibold transition-all duration-300",
              theme === "light"
                ? "bg-white hover:bg-white/80 text-black"
                : "bg-black hover:bg-black/80 text-white"
            )}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onProceedToPayment}
            disabled={!termsAgreed}
            className={cn(
              "flex-1 font-semibold transition-all duration-300",
              theme === "dark"
                ? termsAgreed
                  ? "bg-black hover:bg-black/80 text-white"
                  : "bg-white text-black cursor-not-allowed"
                : termsAgreed
                  ? "bg-white hover:bg-white/90 text-black"
                  : "bg-black text-white cursor-not-allowed"
            )}
          >
            {t("pricing.modal.proceedToPayment")}
          </Button>
        </div>

        {!termsAgreed && (
          <p
            className={cn(
              "text-sm text-center mt-3",
              theme === "light" ? "text-red-600" : "text-red-400"
            )}
          >
            {t("pricing.modal.agreeTermsMessage")}
          </p>
        )}
      </div>
    </Modal>
  );
}
