import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button.tsx";

const HeroSection = () => {
  const scrollToNext = () => {
    const nextSection = document.getElementById("candles");
    nextSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://res.cloudinary.com/dt7ozsctz/video/upload/v1764165650/bgVideo_kxr78w.mp4"
            type="video/mp4"
          />
          {/* Fallback image if video doesn't load */}
          <div className="absolute inset-0 bg-black"></div>
        </video>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      </div>

      <div className="text-center z-10 max-w-4xl pt-48">
        {/* Angel wings decoration - adjusted opacity for video background */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            <path
              d="M200,300 Q150,200 100,150 Q80,130 60,120 Q40,110 30,100"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M600,300 Q650,200 700,150 Q720,130 740,120 Q760,110 770,100"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Portrait with gold border and halo effect */}
        <div className="relative inline-block mb-12">
          <div className="absolute inset-0 bg-gradient-radial from-primary/40 via-primary/20 to-transparent blur-3xl scale-150 animate-gold-glow" />
          <div className="relative w-56 h-72 md:w-64 md:h-80 mx-auto overflow-hidden rounded-full border-8 border-primary shadow-2xl backdrop-blur-sm">
            <img
              src="https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166230/thomas1_yuknpv.png"
              alt="Memorial Portrait"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Name in gold script */}
        <h1 className="font-script text-4xl md:text-8xl text-gold mb-6 animate-fade-in">
          John Michael Anderson
        </h1>

        {/* Dates on sides */}
        <div className="flex items-center justify-center gap-12 mb-8">
          <div className="text-primary text-3xl md:text-4xl font-heading tracking-wider">1952</div>
          <div className="text-primary text-2xl">✝</div>
          <div className="text-primary text-3xl md:text-4xl font-heading tracking-wider">2024</div>
        </div>

        {/* Tagline */}
        <p className="text-foreground text-xl md:text-2xl italic mb-8 max-w-2xl mx-auto">
          "A life of faith, love, and service to others"
        </p>

        {/* CTA Button */}
        <div className="flex justify-center gap-4 mb-16">
          <Button
            onClick={scrollToNext}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg transition-all duration-300 transform hover:scale-105"
          >
            Light a candle
            <ChevronDown className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
