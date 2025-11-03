"use client";

import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  button: string;
  features: Record<string, string>;
  popular: boolean;
}

interface PricingCardsProps {
  plans: Plan[];
  onPlanSelect: (planId: string) => void;
}

export default function PricingCards({ plans, onPlanSelect }: PricingCardsProps) {
  const { theme } = useTheme();
  const { t } = useTranslations();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative rounded-lg p-6 lg:p-8 transition-all duration-300 hover:scale-105 border backdrop-blur-sm",
            theme === "light"
              ? "bg-white border-black shadow-lg text-black"
              : "bg-black/70 border-white/30 shadow-xl text-white",
            plan.popular && (theme === "light" ? "ring-2 ring-black/20" : "ring-2 ring-white/30")
          )}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div
                className={cn(
                  "px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg backdrop-blur-sm",
                  theme === "light" ? "bg-black text-white" : "bg-white/80 text-black"
                )}
              >
                <Star className={cn("w-4 h-4", theme === "light" ? "text-white" : "text-black")} />
                {t("pricing.plans.premium.badge")}
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <h4
              className={cn(
                "text-xl font-serif font-bold mb-2",
                theme === "light" ? "text-black" : "text-white"
              )}
            >
              {t(`pricing.plans.${plan.id}.name`)}
            </h4>
            <div
              className={cn(
                "text-3xl font-bold mb-1",
                theme === "light" ? "text-black" : "text-white"
              )}
            >
              ₦{plan.price}
              {plan.period && (
                <span
                  className={cn(
                    "text-lg font-normal ml-1",
                    theme === "light" ? "text-black/70" : "text-white/80"
                  )}
                >
                  {t(`pricing.plans.${plan.id}.period`)}
                </span>
              )}
            </div>
            <p className={cn("text-sm", theme === "light" ? "text-black/70" : "text-white/80")}>
              {t(`pricing.plans.${plan.id}.description`)}
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            {Object.values(plan.features).map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <Check
                  className={cn(
                    "w-5 h-5 mr-3 mt-0.5 flex-shrink-0",
                    theme === "light" ? "text-black" : "text-white"
                  )}
                />
                <span
                  className={cn("text-sm", theme === "light" ? "text-black/80" : "text-white/80")}
                >
                  {feature as string}
                </span>
              </li>
            ))}
          </ul>

          <Button
            className={cn(
              "w-full font-semibold transition-all duration-300 text-base px-5 py-3 sm:text-lg sm:px-6 sm:py-4 border backdrop-blur-sm",
              plan.popular
                ? theme === "light"
                  ? "bg-black hover:bg-black/80 text-white border-black"
                  : "bg-white/80 hover:bg-white text-black border-white/50"
                : theme === "light"
                  ? "bg-white hover:bg-gray-100 text-black border-black"
                  : "bg-black/70 hover:bg-black/90 text-white border-white/30"
            )}
            onClick={() => onPlanSelect(plan.id)}
          >
            {t(`pricing.plans.${plan.id}.button`)}
          </Button>
        </div>
      ))}
    </div>
  );
}
