"use client";

import { useState, useEffect } from "react";
import { useTemplate } from "../../TemplateProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textArea";
import { Input } from "@/components/ui/input";
import { Flame, Share2, Facebook, Twitter, Mail, Heart, DollarSign } from "lucide-react";
import SupportModal from "./SupportModal";

interface Tribute {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
}

interface Candle {
  id: string;
  lightedBy: string;
  createdAt: string;
}

export const TributesModern = () => {
  const { memorial, memorialOwner } = useTemplate();
  const [candleCount, setCandleCount] = useState(0);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [newTributeName, setNewTributeName] = useState("");
  const [newTributeMessage, setNewTributeMessage] = useState("");
  const [submittingTribute, setSubmittingTribute] = useState(false);

  useEffect(() => {
    if (memorial?.id) {
      fetchTributesAndCandles();
    }
  }, [memorial?.id]);

  const fetchTributesAndCandles = async () => {
    if (!memorial?.id) return;

    try {
      const [tributesResponse, candlesResponse] = await Promise.all([
        fetch(`/api/memorial/${memorial.id}/tributes`),
        fetch(`/api/memorial/${memorial.id}/candles`),
      ]);

      if (tributesResponse.ok) {
        const tributesData = await tributesResponse.json();
        setTributes(tributesData.filter((t: Tribute) => t.isPublic));
      }

      if (candlesResponse.ok) {
        const candlesData = await candlesResponse.json();
        setCandleCount(candlesData.length);
      }
    } catch (error) {
      console.error("Error fetching tributes and candles:", error);
    } finally {
      setLoading(false);
    }
  };

  const lightCandle = async () => {
    if (!memorial?.id) return;

    try {
      const response = await fetch(`/api/memorial/${memorial.id}/candles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lightedBy: "Anonymous Visitor",
        }),
      });

      if (response.ok) {
        setCandleCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error lighting candle:", error);
    }
  };

  const submitTribute = async () => {
    if (!memorial?.id || !newTributeMessage.trim()) return;

    setSubmittingTribute(true);
    try {
      const response = await fetch(`/api/memorial/${memorial.id}/tributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: newTributeName.trim() || "Anonymous",
          content: newTributeMessage.trim(),
          isPublic: true,
        }),
      });

      if (response.ok) {
        setNewTributeName("");
        setNewTributeMessage("");
        fetchTributesAndCandles(); // Refresh tributes
      }
    } catch (error) {
      console.error("Error submitting tribute:", error);
    } finally {
      setSubmittingTribute(false);
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden px-4 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <div className="animate-pulse text-cream">Loading memorial content...</div>
        </div>
      </section>
    );
  }

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
            Share Your Memories
          </h2>
          <p className="text-cream/80">
            Leave a tribute and light a candle in {memorial?.firstName}'s honor
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Tributes */}
          <div className="space-y-6 lg:col-span-2">
            {tributes.length > 0 ? (
              tributes.map((tribute, index) => (
                <div
                  key={tribute.id}
                  className="animate-fade-in-up rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg transition-smooth hover:border-soft-gold/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft-gold text-lg font-bold text-burgundy">
                      {tribute.authorName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-cream">{tribute.authorName}</h3>
                          <p className="text-sm text-cream/80">
                            {new Date(tribute.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Flame className="h-5 w-5 animate-flicker text-soft-gold" />
                      </div>
                      <p className="leading-relaxed text-cream/90">{tribute.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-cream/20 bg-cream/10 p-8 text-center shadow-elegant backdrop-blur-lg">
                <p className="text-cream/80">No tributes yet. Be the first to share a memory.</p>
              </div>
            )}
          </div>

          {/* Right: Light Candle & Share */}
          <div className="space-y-6">
            {/* Candle Counter */}
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

            {/* Support Memorial */}
            {memorialOwner?.accountDetails && (
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
            <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-lg">
              <h3 className="mb-4 text-center font-semibold text-cream">Leave a Tribute</h3>
              <div className="space-y-4">
                <Input
                  value={newTributeName}
                  onChange={(e) => setNewTributeName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                />
                <Textarea
                  value={newTributeMessage}
                  onChange={(e) => setNewTributeMessage(e.target.value)}
                  placeholder="Share your memories and thoughts..."
                  className="border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                  rows={4}
                />
                <Button
                  onClick={submitTribute}
                  disabled={!newTributeMessage.trim() || submittingTribute}
                  className="w-full transform rounded-full bg-soft-gold font-semibold text-burgundy transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                >
                  {submittingTribute ? "Submitting..." : "Share Tribute"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Modal */}
        <SupportModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          memorialOwner={memorialOwner}
          memorialId={memorial?.id}
        />
      </div>
    </section>
  );
};
