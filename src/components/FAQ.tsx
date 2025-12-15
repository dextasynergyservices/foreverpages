"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

export const FAQSection: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [, setIsVisible] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null); // ✅ none open initially

  // Intersection Observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleItem = (index: number) => {
    setOpenItem((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      question: t("faq.items.memorialDuration.question"),
      answer: t("faq.items.memorialDuration.answer"),
    },
    {
      question: t("faq.items.contentTypes.question"),
      answer: t("faq.items.contentTypes.answer"),
    },
    {
      question: t("faq.items.privacyControl.question"),
      answer: t("faq.items.privacyControl.answer"),
    },
    {
      question: t("faq.items.multipleContributors.question"),
      answer: t("faq.items.multipleContributors.answer"),
    },
    {
      question: t("faq.items.changesAfterCreation.question"),
      answer: t("faq.items.changesAfterCreation.answer"),
    },
    {
      question: t("faq.items.cost.question"),
      answer: t("faq.items.cost.answer"),
    },
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>

      <section
        id="faq"
        ref={sectionRef}
        className={cn(
          "relative w-full py-16 px-4 sm:px-6 lg:px-8",
          theme === "dark" ? "bg-black/95 text-white" : "bg-white text-black"
        )}
      >
        <div className="relative z-10 max-w-4xl mx-auto w-full">
          {/* Title */}
          <div className="text-center mb-12 sm:mb-16">
            <div
              className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto",
                theme === "dark"
                  ? "bg-white/10 border border-white/20"
                  : "bg-black/10 border border-black/20"
              )}
            >
              <HelpCircle
                className={cn("w-8 h-8", theme === "dark" ? "text-white" : "text-black")}
              />
            </div>

            <h3
              className={cn("text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4")}
            >
              {t("faq.title")}
            </h3>
            <p
              className={cn(
                "text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-4",
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              )}
            >
              {t("faq.subtitle")}
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4 mb-12">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "faq-item border-2 rounded-lg backdrop-blur-sm overflow-hidden transition-all duration-300",
                  theme === "dark" ? "border-white/20 bg-black/40" : "border-black/20 bg-white/80",
                  openItem === index
                    ? theme === "dark"
                      ? "shadow-lg shadow-white/10"
                      : "shadow-lg shadow-black/10"
                    : ""
                )}
              >
                {/* Question */}
                <button
                  onClick={() => toggleItem(index)}
                  className={cn(
                    "w-full px-6 py-4 text-left flex items-center justify-between gap-4 transition-colors duration-200",
                    theme === "dark"
                      ? "hover:bg-white hover:text-black"
                      : "hover:bg-black hover:text-white"
                  )}
                >
                  <span className="font-serif font-semibold text-lg flex-1">{item.question}</span>
                  {openItem === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>

                {/* Answer */}
                {openItem === index && (
                  <div
                    className={cn(
                      "px-6 pb-4 animate-slide-down",
                      theme === "dark" ? "text-white/80" : "text-black/80"
                    )}
                  >
                    <div
                      className="border-l-2 pl-4 py-1"
                      style={{
                        borderColor: theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                      }}
                    >
                      <p className="leading-relaxed text-base">{item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Help CTA */}
          <div className="text-center">
            <div
              className={cn(
                "inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-lg backdrop-blur-sm border-2",
                theme === "dark"
                  ? "border-white/20 bg-black/40 text-white"
                  : "border-black/20 bg-white/80 text-black"
              )}
            >
              <div className="text-left">
                <h4 className="font-serif font-semibold text-lg mb-1">{t("faq.help.title")}</h4>
                <p className={cn("text-sm", theme === "dark" ? "text-white/70" : "text-black/70")}>
                  {t("faq.help.description")}
                </p>
              </div>

              {/* Button to /#contact */}
              <Button
                className={cn(
                  "px-6 py-2 font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap",
                  theme === "dark"
                    ? "bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl"
                    : "bg-black text-white hover:bg-black/90 shadow-lg hover:shadow-xl"
                )}
                size="lg"
                onClick={() => router.push("/#contact")}
              >
                {t("faq.help.button")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
