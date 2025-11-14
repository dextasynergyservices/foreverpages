"use client";

import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { usePlansWithCurrency } from "@/hooks/usePlansWithCurrency";
import { CurrencySelector, type Currency } from "@/components/CurrencySelector";
import { cn } from "@/lib/utils";
import PricingCards from "@/components/pricingSection/pricing-cards";
import PaymentModal from "@/components/payment/PaymentModal";

const PricingSection = (): React.ReactNode => {
  const { t } = useTranslations();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("NGN");
  const { plans = [], isLoading, error } = usePlansWithCurrency(selectedCurrency);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    setActiveModal(planName);
    setTermsAgreed(false);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedPlan(null);
    setTermsAgreed(false);
  };

  const handleTermsAgree = (agreed: boolean) => {
    setTermsAgreed(agreed);
  };

  return (
    <section
      className={cn(
        "scroll-section relative min-h-screen w-full py-16 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300 overflow-x-hidden bg-background"
      )}
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full mt-20">
        <div className="text-center mb-12 sm:mb-16">
          <h3
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4 transition-colors duration-300 text-foreground"
            )}
          >
            {t("pricing.title")}
          </h3>
          <p
            className={cn(
              "text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-4 transition-colors duration-300 text-muted-foreground"
            )}
          >
            {t("pricing.subtitle")}
          </p>

          {/* Currency Selector */}
          <div className="flex justify-center mt-6">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {/* Pricing Cards */}
        {!isLoading && !error && <PricingCards plans={plans} onPlanSelect={handlePlanSelect} />}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={!!activeModal}
          selectedPlan={selectedPlan}
          plans={plans}
          termsAgreed={termsAgreed}
          onClose={handleCloseModal}
          onTermsAgree={handleTermsAgree}
        />
      </div>
    </section>
  );
};

export default PricingSection;
