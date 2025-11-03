"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

export const Footer: React.FC = () => {
  const { t } = useTranslations();

  return (
    <footer className="bg-black py-8 sm:py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            <span className="text-white text-base sm:text-lg font-serif font-semibold">
              {t("navbar.logo")}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white">
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/privacy-policy">{t("footer.links.privacy")}</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/terms-of-service">{t("footer.links.terms")}</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/support">{t("footer.links.support")}</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-primary" asChild>
              <Link href="/contact">{t("footer.links.contact")}</Link>
            </Button>
          </div>
        </div>
        <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-white">
          <p>
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};
