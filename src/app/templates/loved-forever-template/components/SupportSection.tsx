"use client";

import { HeartHandshake } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

const SupportSection = () => {
  const { openBlessingModal } = useTemplate();

  return (
    <section id="support" className="relative py-20 px-4 text-white overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-fixed bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764852176/thomas1_itt2fo.png)`,
        }}
      ></div>

      {/* Light green gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/70 via-[#2e3a25]/90 to-[#1f2615]/80 z-0"></div>

      {/* Enhanced soft light overlay for sunlight glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

      {/* Additional gradient for smoother transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>

      {/* Optional texture overlay for depth */}
      <div className="absolute inset-0 bg-[url('/textures/forest-light.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <div className="relative container mx-auto max-w-4xl z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 md:p-12 border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.3)] text-center animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full animate-pulse"></div>
              <HeartHandshake className="w-16 h-16 md:w-20 md:h-20 text-amber-300 relative z-10 animate-float" />
            </div>
          </div>

          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-amber-100">
            Support the Family
          </h2>

          <p className="font-body text-lg text-amber-50/90 leading-relaxed mb-8 max-w-2xl mx-auto">
            During this difficult time, your support means the world to the family. Your generous
            contributions help cover expenses and provide comfort as they navigate this profound
            loss.
          </p>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-400/20 backdrop-blur-sm">
              <p className="font-body text-amber-100 text-sm">
                All donations go directly to supporting the family during this difficult time
              </p>
            </div>
          </div>

          <button
            onClick={openBlessingModal}
            className="bg-gradient-to-r from-amber-600/50 to-amber-700/40 hover:from-amber-600/60 hover:to-amber-700/50 border border-amber-400/30 text-amber-100 font-body font-semibold px-4 py-3 text-sm md:px-12 md:py-6 md:text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(251,191,36,0.3)] backdrop-blur-sm rounded-md"
          >
            Send Your Support
          </button>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
