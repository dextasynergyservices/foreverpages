"use client";

import { useEffect, useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

const Navbar = () => {
  const { openBlessingModal } = useTemplate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: "life", label: "Life" },
    { id: "family", label: "Family" },
    { id: "photos", label: "Photos" },
    { id: "tributes", label: "Tributes" },
    { id: "support", label: "Support" },
    { id: "condolences", label: "Condolences" },
  ];

  return (
    <>
      {/* Background Overlay Behind Navbar */}
      <div
        className={`fixed top-0 left-0 right-0 h-24 md:h-28 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-gradient-to-b from-black/50 to-transparent"
            : "bg-gradient-to-b from-black/40 to-transparent"
        }`}
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-xl bg-gradient-to-r from-[#3a4b2f] via-[#2e3a25] to-[#1f2615] border-b border-amber-300/20 shadow-[0_0_30px_rgba(0,0,0,0.4)] py-3"
            : "backdrop-blur-lg bg-gradient-to-r from-[#3a4b2f] via-[#2e3a25] to-[#1f2615] py-4 md:py-6"
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="font-body text-sm text-amber-100 hover:text-amber-50 transition-colors duration-300 hover:scale-105"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={openBlessingModal}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400 text-amber-100 font-body font-semibold px-6 py-2 rounded-md shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all duration-300 hover:scale-105"
            >
              Send Blessing
            </button>
          </div>

          {/* Mobile Navigation Header */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex-1"></div>

            {/* Send Blessing Button - Centered on Mobile */}
            {/* <Button
              onClick={onSendBlessing}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400 text-amber-100 font-body font-semibold px-4 shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all duration-300 hover:scale-105 text-sm"
            >
              Send Blessing ✨
            </Button> */}

            {/* Mobile Menu Button */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-amber-100 hover:text-amber-50 transition-colors duration-300 hover:bg-amber-300/10 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
            isMobileMenuOpen
              ? "bg-black/90" // Much darker overlay
              : "pointer-events-none bg-transparent"
          }`}
        >
          {/* Side Menu - SOLID BACKGROUND */}
          <div
            ref={mobileMenuRef}
            className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-[#1f2615] border-l border-amber-300/30 shadow-2xl transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-amber-300/30 bg-[#2e3a25]">
              <h3 className="font-heading text-amber-100 text-lg">Navigation</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-amber-200 hover:text-amber-100 hover:bg-amber-300/10 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-6 bg-[#1f2615]">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="font-body text-amber-100 hover:text-amber-50 hover:bg-amber-300/10 py-4 px-4 rounded-xl transition-all duration-300 text-left border border-transparent hover:border-amber-300/20 text-base bg-[#2e3a25]/50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Send Blessing Button in Menu */}
              <div className="mt-8 pt-6 border-t border-amber-300/30">
                <button
                  onClick={() => {
                    openBlessingModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400 text-amber-100 font-body font-semibold py-4 rounded-md shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all duration-300 hover:scale-105"
                >
                  Send Blessing
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Prevent body scroll when mobile menu is open */}
      <style>{`
        ${
          isMobileMenuOpen
            ? `
          body {
            overflow: hidden;
          }
        `
            : ""
        }
      `}</style>
    </>
  );
};

export default Navbar;
