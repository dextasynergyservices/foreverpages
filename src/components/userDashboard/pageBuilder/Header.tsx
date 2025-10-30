import React from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";

export const Header: React.FC = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();

  return (
    <div
      className={`border-b ${theme === "dark" ? "border-white/10 bg-black" : "border-gray-200 bg-white"}`}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6" />
            <h1 className="text-lg md:text-xl font-serif font-bold">
              {t("dashboard.pageBuilder.header.title")}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};
