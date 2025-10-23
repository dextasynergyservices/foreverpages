"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/hooks/useTheme";

interface FuneralPageItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  tributes: number;
  visits: number;
}

const sampleFuneralPages: FuneralPageItem[] = [
  {
    id: "1",
    title: "In Loving Memory of Sarah Johnson",
    description:
      "A beautiful tribute filled with family photos, stories from her teaching career, and memories from 45 years of marriage. Sarah touched countless lives through her dedication to education and community service.",
    imageUrl: "/images/memorial-sarah.jpg",
    createdBy: "The Johnson Family",
    tributes: 147,
    visits: 2345,
  },
  {
    id: "2",
    title: "Celebrating the Life of Michael Brown",
    description:
      "A memorial honoring a life well-lived as a devoted father, successful entrepreneur, and passionate volunteer. Michaels legacy continues through the charitable foundation he established.",
    imageUrl: "/images/memorial-michael.jpg",
    createdBy: "The Brown Family",
    tributes: 89,
    visits: 1567,
  },
  {
    id: "3",
    title: "Remembering Grandma Rose Martinez",
    description:
      "A heartfelt collection of memories spanning 82 years, from her childhood stories to her famous family recipes that brought generations together around the dinner table.",
    imageUrl: "/images/memorial-rose.jpg",
    createdBy: "The Martinez Family",
    tributes: 203,
    visits: 3123,
  },
];

// Canvas animation function
const initCanvas = (canvas: HTMLCanvasElement, isDark: boolean) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { PI, cos, sin, sqrt, min } = Math;
  const HEX_CRAD = 12;

  const HEX_BG = isDark ? "#000000" : "#ffffff";
  const HEX_HL = isDark ? "#2d2d2d" : "#e5e5e5";
  const HEX_HLW = 1.5;
  const HEX_GAP = 2;

  const unit_x = 3 * HEX_CRAD + HEX_GAP * sqrt(3);
  const unit_y = HEX_CRAD * sqrt(3) * 0.5 + 0.5 * HEX_GAP;
  const off_x = 1.5 * HEX_CRAD + HEX_GAP * sqrt(3) * 0.5;

  let w: number, h: number, _min: number;
  let grid: { x: number; y: number; hex: { x: number; y: number; r: number } }[];
  let source = { x: 0, y: 0 };
  let t = 0;
  let animationId: number | null = null;
  let isMouseMoving = false;
  let lastMouseTime = 0;

  class GridItem {
    x: number;
    y: number;
    points: { hex: Array<{ x: number; y: number }>; hl: Array<{ x: number; y: number }> };

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
      this.points = { hex: [], hl: [] };
      this.init();
    }

    init() {
      const ba = PI / 3;
      const ri = HEX_CRAD - 0.5 * HEX_HLW;

      for (let i = 0; i < 6; i++) {
        const a = i * ba;
        const x = this.x + HEX_CRAD * cos(a);
        const y = this.y + HEX_CRAD * sin(a);

        this.points.hex.push({ x, y });

        if (i > 2) {
          const xh = this.x + ri * cos(a);
          const yh = this.y + ri * sin(a);
          this.points.hl.push({ x: xh, y: yh });
        }
      }
    }

    draw(ct: CanvasRenderingContext2D) {
      for (let i = 0; i < 6; i++) {
        const method = i === 0 ? "moveTo" : "lineTo";
        ct[method](this.points.hex[i].x, this.points.hex[i].y);
      }
    }

    highlight(ct: CanvasRenderingContext2D) {
      for (let i = 0; i < 3; i++) {
        const method = i === 0 ? "moveTo" : "lineTo";
        ct[method](this.points.hl[i].x, this.points.hl[i].y);
      }
    }
  }

  class Grid {
    cols: number;
    rows: number;
    items: GridItem[];

    constructor(rows: number, cols: number) {
      this.cols = cols || 16;
      this.rows = rows || 16;
      this.items = [];
      this.init();
    }

    init() {
      for (let row = 0; row < this.rows; row++) {
        const y = row * unit_y;
        for (let col = 0; col < this.cols; col++) {
          const x = (row % 2 === 0 ? 0 : off_x) + col * unit_x;
          this.items.push(new GridItem(x, y));
        }
      }
    }

    draw(ct: CanvasRenderingContext2D) {
      ct.fillStyle = HEX_BG;
      ct.beginPath();
      this.items.forEach((item) => item.draw(ct));
      ct.closePath();
      ct.fill();

      ct.strokeStyle = HEX_HL;
      ct.lineWidth = HEX_HLW;
      ct.beginPath();
      this.items.forEach((item) => item.highlight(ct));
      ct.closePath();
      ct.stroke();
    }
  }

  const init = () => {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    _min = 0.75 * min(w, h);
    const rows = ~~(h / unit_y) + 2;
    const cols = ~~(w / unit_x) + 2;
    grid = new Grid(rows, cols);
    source = { x: w / 2, y: h / 2 };
  };

  const fillBackground = (bg_fill: string | CanvasGradient) => {
    ctx.fillStyle = bg_fill;
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.closePath();
    ctx.fill();
  };

  const neon = () => {
    ctx.clearRect(0, 0, w, h);
    fillBackground(HEX_BG);

    const time = t * 0.1;
    const combinedPulse =
      (Math.sin(time) + Math.sin(time * 2.5) * 0.7 + Math.sin(time * 4) * 0.3) / 1.8;
    const normalizedPulse = (combinedPulse + 1) / 2;

    const currentTime = Date.now();
    if (!isMouseMoving && currentTime - lastMouseTime > 2000) {
      const autoX = w / 2 + Math.cos(time * 0.3) * w * 0.3;
      const autoY = h / 2 + Math.sin(time * 0.2) * h * 0.3;
      source.x += (autoX - source.x) * 0.05;
      source.y += (autoY - source.y) * 0.05;
    }

    const lightRange = _min * 0.18;
    const light = ctx.createRadialGradient(source.x, source.y, 0, source.x, source.y, lightRange);
    const lightColor = isDark ? "255,255,255" : "0,0,0";
    const baseOpacity = isDark ? 0.6 : 0.4;
    const pulseIntensity = 0.6;
    const currentLightOpacity = baseOpacity + pulseIntensity * normalizedPulse;

    light.addColorStop(0, `rgba(${lightColor}, ${currentLightOpacity})`);
    light.addColorStop(0.3, `rgba(${lightColor}, ${0.4 + 0.3 * normalizedPulse})`);
    light.addColorStop(0.6, `rgba(${lightColor}, ${0.15 + 0.15 * normalizedPulse})`);
    light.addColorStop(1, `rgba(${lightColor}, 0)`);

    fillBackground(light);
    grid.draw(ctx);

    t++;
    animationId = requestAnimationFrame(neon);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    source = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isMouseMoving = true;
    lastMouseTime = Date.now();

    setTimeout(() => {
      isMouseMoving = false;
    }, 100);
  };

  const handleMouseLeave = () => {
    isMouseMoving = false;
  };

  const handleResize = () => {
    if (animationId) cancelAnimationFrame(animationId);
    init();
    neon();
  };

  init();
  neon();

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleMouseLeave);
  window.addEventListener("resize", handleResize);

  return () => {
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
    window.removeEventListener("resize", handleResize);
    if (animationId) cancelAnimationFrame(animationId);
  };
};

export const FuneralPageSection: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasLightRef = useRef<HTMLCanvasElement>(null);
  const canvasDarkRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== "undefined" && window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;

    let cleanupLight: (() => void) | undefined;
    let cleanupDark: (() => void) | undefined;

    const timeoutId = setTimeout(() => {
      if (canvasLightRef.current) cleanupLight = initCanvas(canvasLightRef.current, false);
      if (canvasDarkRef.current) cleanupDark = initCanvas(canvasDarkRef.current, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      cleanupLight?.();
      cleanupDark?.();
    };
  }, [isMobile]);

  // Simple Intersection Observer animations
  useEffect(() => {
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

    const targets = document.querySelectorAll(
      ".funeral-title, .funeral-description, .memorial-card, .view-more-btn"
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

  return (
    <section
      ref={sectionRef}
      className={cn(
        "scroll-section relative min-h-screen w-full py-16 overflow-hidden",
        theme === "dark" ? "section-bg section-bg--stars" : "bg-white"
      )}
    >
      {/* Canvas background - Only on desktop/tablet */}
      {!isMobile && (
        <>
          <canvas
            ref={canvasLightRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              theme === "light" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          <canvas
            ref={canvasDarkRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              theme === "dark" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        </>
      )}

      {/* Mobile background */}
      {isMobile && (
        <div
          className={`absolute inset-0 w-full h-full transition-colors duration-300 ${
            theme === "dark" ? "bg-black" : "bg-white"
          }`}
        />
      )}

      {/* Content */}
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3
              className={cn(
                "funeral-title text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4 opacity-0 transition-all duration-1000 translate-y-8 [.animate-in_&]:opacity-100 [.animate-in_&]:translate-y-0",
                theme === "dark" ? "text-white" : "text-black"
              )}
            >
              Community Memorials
            </h3>
            <p
              className={cn(
                "funeral-description text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-4 opacity-0 transition-all duration-1000 translate-y-8 delay-200 [.animate-in_&]:opacity-100 [.animate-in_&]:translate-y-0",
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              )}
            >
              See how others are honoring their loved ones with beautiful, personalized memorial
              pages
            </p>
          </div>

          <div className="memorial-cards-grid grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {sampleFuneralPages.map((page, index) => (
              <div
                key={page.id}
                className={cn(
                  "memorial-card rounded-xl overflow-hidden border-2 opacity-0 transition-all duration-700 translate-y-8 [.animate-in_&]:opacity-100 [.animate-in_&]:translate-y-0",
                  theme === "dark"
                    ? "bg-[#0c0c0c] text-white border-white/20 hover:border-white/40"
                    : "bg-white text-black border-black/20 hover:border-black/40"
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="card-content">
                  <div
                    className={cn(
                      "w-full h-48 sm:h-56 flex items-center justify-center relative",
                      theme === "dark" ? "bg-[#111]" : "bg-gray-50"
                    )}
                  >
                    <span className={theme === "dark" ? "text-white/70" : "text-black/70"}>
                      Memorial Image
                    </span>
                    <div
                      className={cn(
                        "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium",
                        theme === "dark" ? "bg-white text-black" : "bg-black text-white"
                      )}
                    >
                      <Star className="h-3 w-3 inline mr-1" />
                      Featured
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h4
                      className={cn(
                        "text-lg sm:text-xl font-serif font-semibold mb-2 sm:mb-3",
                        theme === "dark" ? "text-white" : "text-black"
                      )}
                    >
                      {page.title}
                    </h4>
                    <p
                      className={cn(
                        "text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed",
                        theme === "dark" ? "text-white/80" : "text-black/70"
                      )}
                    >
                      {page.description}
                    </p>
                    <div
                      className={cn(
                        "flex justify-between items-center text-xs mb-3",
                        theme === "dark" ? "text-white/70" : "text-black/70"
                      )}
                    >
                      <div className="flex items-center">
                        <Users
                          className={cn(
                            "h-3 w-3 mr-1",
                            theme === "dark" ? "text-white" : "text-black"
                          )}
                        />
                        {page.tributes} tributes
                      </div>
                      <div className="flex items-center">
                        <Clock
                          className={cn(
                            "h-3 w-3 mr-1",
                            theme === "dark" ? "text-white" : "text-black"
                          )}
                        />
                        {page.visits} visits
                      </div>
                    </div>
                    <p
                      className={cn(
                        "text-xs border-t pt-3",
                        theme === "dark"
                          ? "text-white/70 border-white/20"
                          : "text-black/70 border-black/10"
                      )}
                    >
                      By {page.createdBy}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View More Button */}
          <div className="text-center mb-12">
            <Link
              href="/funeral-pages"
              className={cn(
                "view-more-btn inline-flex items-center px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm transition-colors opacity-0 scale-95 [.animate-in_&]:opacity-100 [.animate-in_&]:scale-100",
                theme === "dark"
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-black text-white hover:bg-gray-800"
              )}
              style={{ transitionDelay: "600ms" }}
            >
              View More Memorials
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
