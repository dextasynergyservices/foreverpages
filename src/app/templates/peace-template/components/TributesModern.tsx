"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Flame, Share2, Facebook, Twitter, Mail, Heart, Loader2, DollarSign } from "lucide-react";
import { useTemplate } from "../TemplateProvider";
import toast from "react-hot-toast";
import SupportModal from "@/components/modals/SupportModal";

interface Tribute {
  id: string;
  name: string;
  relation?: string;
  relationship?: string;
  message: string;
  candle?: boolean;
  offering?: string;
}

export const TributesModern = () => {
  const { sectionsData, memorial, memorialOwner } = useTemplate();

  // Get TRIBUTES section data with fallbacks
  const tributesData = (sectionsData?.TRIBUTES as any) || {};

  // Settings from editor
  const allowPublicTributes = tributesData.allowPublicTributes !== false;
  const showVirtualOfferings = tributesData.showVirtualOfferings !== false;
  const sectionTitle = tributesData.title || "Share Your Memories";
  const sectionSubtitle =
    tributesData.subtitle || "Leave a tribute and light a candle in their honor";

  // State for tributes (will be fetched from API in real implementation)
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [candleCount, setCandleCount] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Form state
  const [newTribute, setNewTribute] = useState({
    name: "",
    relationship: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch approved tributes from database
  useEffect(() => {
    const fetchTributes = async () => {
      if (!memorial?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch approved tributes for this memorial
        const response = await fetch(`/api/public/memorial/${memorial.id}/tributes`);
        if (response.ok) {
          const data = await response.json();
          setTributes(data.tributes || []);
          setCandleCount(data.candleCount || 0);
        }
      } catch (error) {
        console.error("Error fetching tributes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTributes();
  }, [memorial?.id]);

  const lightCandle = async () => {
    setCandleCount((prev) => prev + 1);
    // In real implementation, this would also save to database
  };

  const handleSubmitTribute = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted", { newTribute, memorialId: memorial?.id });

    if (!newTribute.name || !newTribute.message) {
      toast.error("Please fill in your name and message");
      return;
    }

    if (!memorial?.id) {
      console.error("Memorial ID is missing", memorial);
      toast.error("Memorial not found");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting tribute to API...");

    try {
      const response = await fetch(`/api/public/memorial/${memorial.id}/tributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTribute.name,
          relationship: newTribute.relationship || "Friend",
          message: newTribute.message,
        }),
      });

      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API response data:", data);

      if (response.ok) {
        setNewTribute({ name: "", relationship: "", message: "" });
        toast.success("Your tribute has been submitted for review");
      } else {
        toast.error(data.error || "Failed to submit tribute");
      }
    } catch (error) {
      console.error("Error submitting tribute:", error);
      toast.error("Failed to submit tribute");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="legacy" className="relative overflow-hidden px-4 py-20">
      <div className="z-2 absolute inset-0">
        {/* Theme Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy/80 via-burgundy/70 to-deep-plum/80 mix-blend-multiply" />
        {/* Subtle pattern overlay for texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-burgundy/20 to-deep-plum/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            {sectionTitle}
          </h2>
          <p className="text-cream/80">{sectionSubtitle}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Tributes */}
          <div className="space-y-6 lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cream/60" />
              </div>
            ) : tributes.length === 0 ? (
              <div className="rounded-2xl border border-cream/20 bg-cream/10 p-12 text-center shadow-elegant backdrop-blur-lg">
                <Heart className="mx-auto mb-4 h-12 w-12 text-cream/40" />
                <p className="text-lg text-cream/60">No tributes yet</p>
                <p className="mt-2 text-sm text-cream/40">
                  {allowPublicTributes
                    ? "Be the first to share a memory"
                    : "Tributes will appear here"}
                </p>
              </div>
            ) : (
              tributes.map((tribute, index) => (
                <div
                  key={tribute.id}
                  className="animate-fade-in-up rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg transition-smooth hover:border-soft-gold/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft-gold text-lg font-bold text-burgundy">
                      {tribute.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-cream">{tribute.name}</h3>
                          <p className="text-sm text-cream/80">
                            {tribute.relation || tribute.relationship}
                          </p>
                        </div>
                        {(tribute.candle || tribute.offering === "candle") && (
                          <Flame className="h-5 w-5 animate-flicker text-soft-gold" />
                        )}
                      </div>
                      <p className="leading-relaxed text-cream/90">{tribute.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Light Candle & Share */}
          <div className="space-y-6">
            {/* Candle Counter */}
            {showVirtualOfferings && (
              <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 text-center shadow-elegant backdrop-blur-lg">
                {/* Flame Video with Overlay */}
                <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full">
                  <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                    <source
                      src="https://res.cloudinary.com/dxoorukfj/video/upload/v1764690139/candle1_cjbd2x.mp4"
                      type="video/mp4"
                    />
                    <div className="h-full w-full bg-gradient-to-br from-orange-900 via-orange-800 to-yellow-900" />
                  </video>
                  {/* Gold overlay for the flame video */}
                  <div className="absolute inset-0 rounded-full bg-soft-gold/30 mix-blend-overlay" />
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-soft-gold/50" />
                </div>

                <p className="mb-2 text-4xl font-bold text-soft-gold">{candleCount}</p>
                <p className="mb-4 text-cream/80">Candles Lit</p>
                <Button
                  onClick={lightCandle}
                  className="w-full transform rounded-full bg-soft-gold font-semibold text-burgundy transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90"
                >
                  Light a Candle
                </Button>
              </div>
            )}

            {/* Support Memorial */}
            {memorialOwner?.accountDetails &&
              (memorialOwner.accountDetails as unknown[]).length > 0 && (
                <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 text-center shadow-elegant backdrop-blur-lg">
                  <div className="mb-4">
                    <Heart className="mx-auto h-8 w-8 text-soft-gold" />
                  </div>
                  <h3 className="mb-2 font-semibold text-cream">Support the Memorial</h3>
                  <p className="mb-4 text-sm text-cream/80">
                    Honor their memory with a donation to the family
                  </p>
                  <Button
                    onClick={() => setShowSupportModal(true)}
                    className="w-full transform rounded-full border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:scale-105 hover:bg-soft-gold hover:text-burgundy"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Donate Now
                  </Button>
                </div>
              )}

            {/* Social Sharing */}
            <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg">
              <h3 className="mb-4 text-center font-semibold text-cream">Share This Memorial</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Facebook className="h-5 w-5" />
                  Share on Facebook
                </Button>
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Twitter className="h-5 w-5" />
                  Share on Twitter
                </Button>
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Mail className="h-5 w-5" />
                  Share via Email
                </Button>
                <Button className="w-full justify-start gap-3 border-2 border-soft-gold bg-transparent font-semibold text-soft-gold transition-all duration-300 hover:bg-soft-gold hover:text-burgundy">
                  <Share2 className="h-5 w-5" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Add Tribute Form */}
            {allowPublicTributes && (
              <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg">
                <h3 className="mb-4 text-center font-semibold text-cream">Leave a Tribute</h3>
                <form onSubmit={handleSubmitTribute} className="space-y-4">
                  <Input
                    placeholder="Your Name"
                    value={newTribute.name}
                    onChange={(e) => setNewTribute({ ...newTribute, name: e.target.value })}
                    className="border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Relationship"
                    value={newTribute.relationship}
                    onChange={(e) => setNewTribute({ ...newTribute, relationship: e.target.value })}
                    className="border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                    disabled={isSubmitting}
                  />
                  <Textarea
                    placeholder="Share your favorite memory..."
                    value={newTribute.message}
                    onChange={(e) => setNewTribute({ ...newTribute, message: e.target.value })}
                    className="min-h-[100px] border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full transform rounded-full bg-soft-gold font-semibold text-burgundy transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Post Tribute"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        memorialOwnerId={memorialOwner?.id}
        memorialOwnerName={memorialOwner?.firstName || memorialOwner?.lastName || "Memorial Owner"}
        preloadedAccountDetails={
          memorialOwner?.accountDetails as
            | Array<{
                id: string;
                type: string;
                accountName: string;
                accountNumber: string;
                bankName?: string;
                routingNumber?: string;
                currency: string;
                isDefault?: boolean;
                description?: string;
              }>
            | undefined
        }
      />
    </section>
  );
};
