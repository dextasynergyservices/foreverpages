import { Heart } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-8 sm:py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-base sm:text-lg font-serif font-semibold">ForeverPages</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white">
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/terms-of-service">Terms of Service</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/support">Support</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        </div>
        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-white">
          <p>&copy; 2024 ForeverPages. Created with love to honor every life.</p>
        </div>
      </div>
    </footer>
  );
};
