"use client";

import { useEffect } from "react";

export function FeaturesSectionClient() {
  useEffect(() => {
    // Only run animations on desktop
    if (window.innerWidth < 768) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    // Observe animation targets
    const targets = document.querySelectorAll(
      ".features-title, .features-description, .feature-card"
    );
    targets.forEach((target) => {
      observer.observe(target);
    });

    return () => {
      targets.forEach((target) => {
        observer.unobserve(target);
      });
    };
  }, []);

  return null; // This component only handles animations
}
