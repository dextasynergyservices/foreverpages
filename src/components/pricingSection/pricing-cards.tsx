"use client";

import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import type { PlanWithCurrency } from "@/hooks/usePlansWithCurrency";

interface PricingCardsProps {
  plans: PlanWithCurrency[];
  onPlanSelect: (planId: string) => void;
}

export default function PricingCards({ plans, onPlanSelect }: PricingCardsProps) {
  const { t } = useTranslations();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative rounded-lg p-6 lg:p-8 transition-all duration-300 hover:scale-105 border backdrop-blur-sm shadow-lg bg-card text-card-foreground",
            plan.isPopular && "ring-2 ring-primary/20"
          )}
        >
          {plan.isPopular && plan.badgeText && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div
                className={cn(
                  "px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg backdrop-blur-sm bg-primary text-primary-foreground"
                )}
              >
                <Star className="w-4 h-4" />
                {plan.badgeText}
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <h4 className="text-xl font-serif font-bold mb-2 text-foreground">{plan.name}</h4>
            <div className="text-3xl font-bold mb-1 text-foreground">{plan.displayPrice}</div>
            {plan.ngnEquivalent && (
              <div className="text-sm text-muted-foreground mb-2">{plan.ngnEquivalent}</div>
            )}
            <p className="text-sm font-medium text-primary mb-2">
              {plan.durationDays} {t("pricing.daysOfForever")}
            </p>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {Object.values(plan.features).map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-foreground" />
                <span className="text-sm text-muted-foreground">{feature as string}</span>
              </li>
            ))}
          </ul>

          <Button
            className={cn(
              "w-full font-semibold transition-all duration-300 text-base px-5 py-3 sm:text-lg sm:px-6 sm:py-4 border backdrop-blur-sm",
              plan.isPopular
                ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                : "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-border"
            )}
            onClick={() => onPlanSelect(plan.slug)}
          >
            {t("pricing.getStarted")}
          </Button>
        </div>
      ))}
    </div>
  );
}
