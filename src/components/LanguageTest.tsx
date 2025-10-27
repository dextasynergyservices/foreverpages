"use client";

import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";

export const LanguageTest: React.FC = () => {
  const { t, locale } = useTranslations();

  return (
    <div className="p-8 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Language Test Component</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Current Language: <strong>{locale}</strong>
        </p>
      </div>

      <div className="mb-6">
        <LanguageSwitcher />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Hero Section Test:</h3>
          <p className="text-lg font-bold">{t("hero.title")}</p>
          <p className="text-gray-600 dark:text-gray-400">{t("hero.subtitle")}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Features Test:</h3>
          <p className="font-bold">{t("features.title")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("features.subtitle")}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Navigation Test:</h3>
          <div className="flex gap-4 text-sm">
            <span>{t("navbar.navigation.features")}</span>
            <span>{t("navbar.navigation.howItWorks")}</span>
            <span>{t("navbar.navigation.support")}</span>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Pricing Test:</h3>
          <p className="font-bold">{t("pricing.title")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("pricing.subtitle")}</p>
        </div>
      </div>
    </div>
  );
};
