import PricingSection from "@/components/pricingSection/pricing-section";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <PricingSection />
      <Footer />
    </div>
  );
}
