import { OptimizedImageServer } from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroSectionClient } from "./HeroSectionClient";

export function HeroSectionServer() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Static background - server rendered */}
      <div className="absolute inset-0 w-full h-full">
        <OptimizedImageServer
          src="/assets/lightmode.png"
          alt="Memorial background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center px-6 py-20">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 sm:mb-8 leading-tight">
          Honor Their Memory
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
          Create beautiful memorial websites where families and friends celebrate lives and share
          memories together
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <Button
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-4 bg-white text-black hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Create a Memorial Page
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105"
          >
            View Sample Memorial
          </Button>
        </div>
      </div>

      {/* Client-side animations */}
      <HeroSectionClient />
    </section>
  );
}
