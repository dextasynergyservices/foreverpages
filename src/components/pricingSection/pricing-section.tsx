"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import PricingCards from "@/components/pricingSection/pricing-cards";
import PricingModal from "@/components/pricingSection/pricing-modal";
import { plans } from "@/components/pricingSection/pricing-data";

const PricingSection = (): React.ReactNode => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const canvasRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Canvas animation effect
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

  const handleProceedToPayment = () => {
    if (!termsAgreed) return;
    console.log("Proceeding to payment for plan:", selectedPlan);
    alert(`Proceeding to payment for ${selectedPlan} plan!`);
    // Add your payment logic here
  };

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
        <PricingCards plans={plans} onPlanSelect={handlePlanSelect} />

        {/* Modal */}
        <PricingModal
          isOpen={!!activeModal}
          selectedPlan={selectedPlan}
          termsAgreed={termsAgreed}
          onClose={handleCloseModal}
          onTermsAgree={handleTermsAgree}
          onProceedToPayment={handleProceedToPayment}
        />
      </div>
    </section>
  );
};

export default PricingSection;
