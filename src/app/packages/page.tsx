import PricingSection from "@/components/pricingSection/pricing-section";
import { Navbar } from "@/components/Navbar";

export default function page() {
  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <Navbar />
      </div>
      <div className="mb-8">
        <PricingSection />
      </div>
    </div>
  );
}
