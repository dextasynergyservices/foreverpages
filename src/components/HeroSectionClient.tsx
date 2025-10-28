"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export function HeroSectionClient() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Store the current ref value in a variable at the start
    const currentBackgroundRef = backgroundRef.current;

    // Only run animations on client side
    if (currentBackgroundRef) {
      gsap.to(currentBackgroundRef, {
        backgroundPosition: "100% 100%",
        duration: 25,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }

    return () => {
      // Use the captured variable in cleanup
      if (currentBackgroundRef) {
        gsap.killTweensOf(currentBackgroundRef);
      }
    };
  }, []);

  return (
    <div
      ref={backgroundRef}
      className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      style={{ backgroundImage: "url('/assets/lightmode.png')" }}
    />
  );
}
