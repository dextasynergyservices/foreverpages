import dynamic from "next/dynamic";

// Server-side components (SSR enabled)
export const LazyHeroSection = dynamic(
  () => import("./HeroSectionServer").then((mod) => ({ default: mod.HeroSectionServer })),
  {
    loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>,
    ssr: true,
  }
);

export const LazyFeaturesSection = dynamic(
  () => import("./FeatureSectionServer").then((mod) => ({ default: mod.FeaturesSectionServer })),
  {
    loading: () => (
      <div className="py-20 flex items-center justify-center">Loading features...</div>
    ),
    ssr: true,
  }
);

export const LazyFuneralPageSection = dynamic(
  () => import("./FuneralPageSection").then((mod) => ({ default: mod.FuneralPageSection })),
  {
    loading: () => <div className="py-20 flex items-center justify-center">Loading...</div>,
    ssr: true,
  }
);

export const LazyHowItWorksSection = dynamic(
  () => import("./HowItWorksSection ").then((mod) => ({ default: mod.HowItWorksSection })),
  {
    loading: () => <div className="py-20 flex items-center justify-center">Loading...</div>,
    ssr: true,
  }
);

export const LazyPricingSection = dynamic(
  () => import("./PricingSection").then((mod) => ({ default: mod.PricingSection })),
  {
    loading: () => <div className="py-20 flex items-center justify-center">Loading...</div>,
    ssr: true,
  }
);

export const LazyTestimonialsSection = dynamic(
  () => import("./TestimonialsSection").then((mod) => ({ default: mod.TestimonialsSection })),
  {
    loading: () => <div className="py-20 flex items-center justify-center">Loading...</div>,
    ssr: true,
  }
);

export const LazyCTASection = dynamic(
  () => import("./CTASection").then((mod) => ({ default: mod.CTASection })),
  {
    loading: () => <div className="py-20 flex items-center justify-center">Loading...</div>,
    ssr: true,
  }
);

export const LazyFooter = dynamic(
  () => import("./Footer").then((mod) => ({ default: mod.Footer })),
  {
    loading: () => <div className="h-32 bg-gray-100" />,
    ssr: true,
  }
);
