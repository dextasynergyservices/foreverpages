"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

interface TermsAndConditionsProps {
  onAgree: (agreed: boolean) => void;
}

export default function TermsAndConditions({ onAgree }: TermsAndConditionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAgreeChange = (checked: boolean) => {
    setAgreed(checked);
    onAgree(checked);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const sections = [
    { key: "serviceDescription", tKey: "termsAndConditions.sections.serviceDescription" },
    { key: "paymentTerms", tKey: "termsAndConditions.sections.paymentTerms" },
    { key: "contentGuidelines", tKey: "termsAndConditions.sections.contentGuidelines" },
    { key: "privacyAndData", tKey: "termsAndConditions.sections.privacyAndData" },
    { key: "serviceAvailability", tKey: "termsAndConditions.sections.serviceAvailability" },
    { key: "intellectualProperty", tKey: "termsAndConditions.sections.intellectualProperty" },
    { key: "termination", tKey: "termsAndConditions.sections.termination" },
    { key: "limitationOfLiability", tKey: "termsAndConditions.sections.limitationOfLiability" },
  ];

  return (
    <div
      className={cn(
        "border rounded-lg transition-all duration-300",
        theme === "dark" ? "border-white/20" : "border-black/20"
      )}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={toggleDropdown}
      >
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="terms-agreement"
            checked={agreed}
            onChange={(e) => handleAgreeChange(e.target.checked)}
            className={cn(
              "w-4 h-4 rounded focus:ring-2 focus:ring-offset-2",
              theme === "dark"
                ? "bg-gray-700 border-gray-600 focus:ring-blue-500 text-white"
                : "bg-white border-gray-300 focus:ring-blue-500 text-black"
            )}
          />
          <label
            htmlFor="terms-agreement"
            className={cn(
              "text-sm font-medium cursor-pointer",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            {t("termsAndConditions.agree")}
          </label>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className={theme === "dark" ? "text-white" : "text-black"} />
        ) : (
          <ChevronDown size={20} className={theme === "dark" ? "text-white" : "text-black"} />
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            "px-4 pb-4 border-t",
            theme === "dark" ? "border-white/20" : "border-black/20"
          )}
        >
          <div
            className={cn(
              "mt-4 text-sm max-h-60 overflow-y-auto space-y-3",
              theme === "dark" ? "text-white" : "text-black"
            )}
          >
            <h4
              className={cn(
                "font-semibold text-base mb-2",
                theme === "dark" ? "text-white" : "text-black"
              )}
            >
              {t("termsAndConditions.title")}
            </h4>

            {sections.map((section) => (
              <section key={section.key}>
                <h5
                  className={cn(
                    "font-semibold mb-1",
                    theme === "dark" ? "text-white" : "text-black"
                  )}
                >
                  {t(`${section.tKey}.title`)}
                </h5>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                  {t(`${section.tKey}.content`)}
                </p>
              </section>
            ))}

            <div
              className={cn(
                "border-t p-4 md:flex-shrink-0 md:sticky md:bottom-0",
                theme === "dark" ? "bg-black border border-white" : "bg-white border border-black"
              )}
            >
              <p className={cn(theme === "dark" ? "text-white" : "text-black")}>
                <strong className={theme === "dark" ? "text-white" : "text-black"}>
                  {t("termsAndConditions.note").split(":")[0]}:
                </strong>
                {t("termsAndConditions.note").split(":")[1]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
