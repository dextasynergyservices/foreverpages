"use client";

import React, { useEffect, useState } from "react";
import { gsap } from "gsap";

interface LoadingPageProps {
  onLoadingComplete: () => void;
  theme: "light" | "dark";
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ onLoadingComplete, theme }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Use a simpler, faster loading animation
    const loadingTl = gsap.timeline({
      onUpdate: () => {
        const progress = loadingTl.progress() * 100;
        setLoadingProgress(progress);
      },
      onComplete: () => {
        // Reduced delay for faster loading
        setTimeout(() => {
          onLoadingComplete();
        }, 100);
      },
    });

    loadingTl.to(
      {},
      {
        duration: 0.5, // Much faster loading
        onUpdate: function () {
          setLoadingProgress(Math.min(100, this.progress() * 100));
        },
        ease: "power2.out",
      }
    );

    return () => {
      loadingTl.kill();
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="text-center">
        <div
          className={`text-5xl font-light mb-3 font-mono tracking-tighter ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {Math.round(loadingProgress)}%
        </div>
        <div className="w-32 h-0.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-100 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        {/* <p className={`mt-4 text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-600"
        }`}>
          Loading your memorial experience...
        </p> */}
      </div>
    </div>
  );
};
