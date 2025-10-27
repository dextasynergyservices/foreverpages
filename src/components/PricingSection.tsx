"use client";

import { useEffect, useRef } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

export const PricingSection = (): React.ReactNode => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef<boolean>(false);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;

    if (isMobileRef.current) {
      if (canvasRef.current) {
        canvasRef.current.innerHTML = "";
        canvasRef.current.style.background =
          "radial-gradient(800px 400px at 50% 50%, hsl(var(--foreground) / 0.06), transparent 60%)";
      }
      return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none";

    if (canvasRef.current) {
      canvasRef.current.innerHTML = "";
      canvasRef.current.appendChild(canvas);
    }

    const circles: Array<{ x: number; y: number; radius: number; opacity: number; speed: number }> =
      [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMove);

    const animate = () => {
      const css = getComputedStyle(document.documentElement);
      const bg = css.getPropertyValue("--background").trim();
      const fg = css.getPropertyValue("--foreground").trim();

      context.fillStyle = `hsl(${bg})`;
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.2) {
        circles.push({
          x: mouseX + (Math.random() - 0.5) * 50,
          y: mouseY + (Math.random() - 0.5) * 50,
          radius: 2,
          opacity: 1,
          speed: 0.5 + Math.random() * 1,
        });
      }

      for (let i = circles.length - 1; i >= 0; i--) {
        const circle = circles[i];
        circle.radius += circle.speed;
        circle.opacity -= 0.008;

        if (circle.opacity <= 0) {
          circles.splice(i, 1);
          continue;
        }

        context.beginPath();
        context.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);

        const alpha = Math.min(1, Math.max(0, (theme === "light" ? 0.35 : 0.6) * circle.opacity));
        context.strokeStyle = `hsl(${fg} / ${alpha})`;
        context.lineWidth = 1.5;
        context.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme]);

  const plans = [
    {
      name: t("pricing.plans.basic.name"),
      price: t("pricing.plans.basic.price"),
      period: t("pricing.plans.basic.period"),
      description: t("pricing.plans.basic.description"),
      button: t("pricing.plans.basic.button"),
      features: {
        photos: t("pricing.plans.basic.features.photos"),
        template: t("pricing.plans.basic.features.template"),
        tributeWall: t("pricing.plans.basic.features.tributeWall"),
        mobile: t("pricing.plans.basic.features.mobile"),
        privacy: t("pricing.plans.basic.features.privacy"),
      },
      popular: false,
    },
    {
      name: t("pricing.plans.premium.name"),
      price: t("pricing.plans.premium.price"),
      period: t("pricing.plans.premium.period"),
      description: t("pricing.plans.premium.description"),
      button: t("pricing.plans.premium.button"),
      features: {
        photos: t("pricing.plans.premium.features.photos"),
        template: t("pricing.plans.premium.features.template"),
        customization: t("pricing.plans.premium.features.customization"),
        support: t("pricing.plans.premium.features.support"),
        backup: t("pricing.plans.premium.features.backup"),
        analytics: t("pricing.plans.premium.features.analytics"),
        domain: t("pricing.plans.premium.features.domain"),
      },
      popular: true,
    },
    {
      name: t("pricing.plans.family.name"),
      price: t("pricing.plans.family.price"),
      period: t("pricing.plans.family.period"),
      description: t("pricing.plans.family.description"),
      button: t("pricing.plans.family.button"),
      features: {
        photos: t("pricing.plans.family.features.photos"),
        template: t("pricing.plans.family.features.template"),
        tributeWall: t("pricing.plans.family.features.tributeWall"),
        mobile: t("pricing.plans.family.features.mobile"),
        privacy: t("pricing.plans.family.features.privacy"),
        support: t("pricing.plans.family.features.support"),
        branding: t("pricing.plans.family.features.branding"),
      },
      popular: false,
    },
  ];

  return (
    <section
      className={cn(
        "relative min-h-screen w-full py-16 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300 overflow-x-hidden",
        theme === "dark" ? "bg-black" : "bg-white"
      )}
    >
      {/* Canvas overlay */}
      <div ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 sm:mb-16">
          <h3
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4 transition-colors duration-300",
              theme === "light" ? "text-gray-900" : "text-white"
            )}
          >
            {t("pricing.title")}
          </h3>
          <p
            className={cn(
              "text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-4 transition-colors duration-300",
              theme === "light" ? "text-gray-700" : "text-gray-300"
            )}
          >
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                "relative rounded-lg p-6 lg:p-8 transition-all duration-300 hover:scale-105 border backdrop-blur-sm",
                theme === "light"
                  ? "bg-white border-black shadow-lg text-black"
                  : "bg-black/70 border-white/30 shadow-xl text-white",
                plan.popular &&
                  (theme === "light" ? "ring-2 ring-black/20" : "ring-2 ring-white/30")
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
                    <Star
                      className={cn("w-4 h-4", theme === "light" ? "text-white" : "text-black")}
                    />
                    {t("pricing.mostPopular")}
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
                  {plan.name}
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
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={cn("text-sm", theme === "light" ? "text-black/70" : "text-white/80")}>
                  {plan.description}
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
                      className={cn(
                        "text-sm",
                        theme === "light" ? "text-black/80" : "text-white/80"
                      )}
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
              >
                {plan.button} {/* Use the button text from the plan object */}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer section */}
        <div
          className={cn(
            "text-center rounded-lg p-6 sm:p-8 border backdrop-blur-sm transition-colors duration-300",
            theme === "light"
              ? "bg-white border-black text-black"
              : "bg-black/70 border-white/30 text-white"
          )}
        >
          <h4
            className={cn(
              "text-lg font-serif font-semibold mb-3",
              theme === "light" ? "text-gray-900" : "text-white"
            )}
          >
            {t("pricing.footer.title")}
          </h4>
          <p
            className={cn(
              "text-sm max-w-2xl mx-auto",
              theme === "light" ? "text-gray-700" : "text-white/80"
            )}
          >
            {t("pricing.footer.description")}
          </p>
        </div>
      </div>
    </section>
  );
};
