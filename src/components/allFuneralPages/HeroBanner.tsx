import React from "react";
import { useTranslations } from "@/hooks/useTranslations";

export const HeroBanner: React.FC = () => {
  const { t } = useTranslations();

  return (
    <div className="relative h-80 w-full">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=60)",
        }}
      />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">
          {t("allFuneralPage.title")}
        </h1>
        <p className="text-lg md:text-xl max-w-2xl">{t("allFuneralPage.subtitle")}</p>
      </div>
    </div>
  );
};
