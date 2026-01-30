"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { Upload, X, ChevronDown, ChevronUp, Share2, User, Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTemplate } from "../TemplateProvider";

interface Tribute {
  id: number | string;
  name: string;
  relationship: string;
  message: string;
  photo?: string;
  offering: "candle" | "flower" | "heart";
  timestamp: string;
  isExpanded?: boolean;
}

const TributeSection = () => {
  const { sectionsData, memorial } = useTemplate();

  // Get TRIBUTES section data with fallbacks
  const tributesData = (sectionsData?.TRIBUTES as Record<string, unknown>) || {};
  const sectionTitle = (tributesData.title as string) || "Share Your Love";
  const sectionSubtitle =
    (tributesData.subtitle as string) ||
    "Light a candle, drop a flower, or share your heart with a tribute message";

  // Settings from editor
  const allowPublicTributes = tributesData.allowPublicTributes !== false;
  const showVirtualOfferings = tributesData.showVirtualOfferings !== false;

  // State for tributes (fetched from API, not hardcoded)
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        }
      } catch (error) {
        console.error("Error fetching tributes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTributes();
  }, [memorial?.id]);

  const [newTribute, setNewTribute] = useState({
    name: "",
    relationship: "",
    message: "",
    photo: "",
    offering: "candle" as "candle" | "flower" | "heart",
  });

  const [selectedTribute, setSelectedTribute] = useState<Tribute | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitTribute = async () => {
    if (!newTribute.name || !newTribute.relationship || !newTribute.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!memorial?.id) {
      toast.error("Memorial not found");
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit tribute to API
      const response = await fetch(`/api/public/memorial/${memorial.id}/tributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTribute.name,
          relationship: newTribute.relationship,
          message: newTribute.message,
          photo: newTribute.photo || undefined,
          offering: newTribute.offering,
        }),
      });

      if (response.ok) {
        setNewTribute({
          name: "",
          relationship: "",
          message: "",
          photo: "",
          offering: "candle",
        });
        toast.success("Your tribute has been submitted for review");
      } else {
        toast.error("Failed to submit tribute");
      }
    } catch (error) {
      console.error("Error submitting tribute:", error);
      toast.error("Failed to submit tribute");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server and get a URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewTribute({ ...newTribute, photo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTributeExpand = (id: number | string) => {
    setTributes(
      tributes.map((tribute) =>
        tribute.id === id ? { ...tribute, isExpanded: !tribute.isExpanded } : tribute
      )
    );
  };

  const openTributeModal = (tribute: Tribute) => {
    setSelectedTribute(tribute);
  };

  const closeTributeModal = () => {
    setSelectedTribute(null);
  };

  const getOfferingIcon = (offering: string) => {
    switch (offering) {
      case "candle":
        return "🕯️";
      case "flower":
        return "🌸";
      case "heart":
        return "❤️";
      default:
        return "💝";
    }
  };

  const getOfferingColor = (offering: string) => {
    switch (offering) {
      case "candle":
        return "bg-amber-500/10 border-amber-400/30";
      case "flower":
        return "bg-pink-500/10 border-pink-400/30";
      case "heart":
        return "bg-rose-500/10 border-rose-400/30";
      default:
        return "bg-purple-500/10 border-purple-400/30";
    }
  };

  const getOfferingButtonColor = (offering: string) => {
    switch (offering) {
      case "candle":
        return "bg-amber-600/80 hover:bg-amber-600 border-amber-500";
      case "flower":
        return "bg-pink-600/80 hover:bg-pink-600 border-pink-500";
      case "heart":
        return "bg-rose-600/80 hover:bg-rose-600 border-rose-500";
      default:
        return "bg-purple-600/80 hover:bg-purple-600 border-purple-500";
    }
  };

  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <>
      <section
        id="tributes"
        className="relative py-12 md:py-20 px-4 text-white overflow-hidden min-h-screen"
      >
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source
              src="https://res.cloudinary.com/dxoorukfj/video/upload/v1764690139/candle1_cjbd2x.mp4"
              type="video/mp4"
            />
          </video>
          {/* Your original green gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/70 via-[#2e3a25]/95 to-[#1f2615]/90 z-0"></div>

          {/* Enhanced soft light overlay for sunlight glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

          {/* Additional gradient for smoother transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>
        </div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-3 md:mb-4 text-amber-100">
              {sectionTitle}
            </h2>
            <p className="font-body text-amber-50/80 text-base md:text-lg max-w-2xl mx-auto px-4">
              {sectionSubtitle}
            </p>
          </div>

          <div
            className={`grid ${allowPublicTributes ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-2xl mx-auto"} gap-6 md:gap-8 items-start`}
          >
            {/* Tribute Form - Only show if public tributes allowed */}
            {allowPublicTributes && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/15 shadow-2xl">
                <h3 className="font-heading text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-amber-100 text-center">
                  Send a Tribute
                </h3>

                <div className="space-y-4 md:space-y-6">
                  {/* Name & Relationship */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="font-body text-amber-200/80 text-sm mb-2 block">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={newTribute.name}
                        onChange={(e) => setNewTribute({ ...newTribute, name: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm rounded-md px-3 py-2"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="font-body text-amber-200/80 text-sm mb-2 block">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        value={newTribute.relationship}
                        onChange={(e) =>
                          setNewTribute({ ...newTribute, relationship: e.target.value })
                        }
                        className="w-full bg-white/10 border border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm rounded-md px-3 py-2"
                        placeholder="e.g., Daughter, Friend"
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="font-body text-amber-200/80 text-sm mb-2 block">
                      Memory Photo (Optional)
                    </label>
                    <div className="flex items-center gap-3 md:gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/5 border border-white/20 text-amber-100 hover:bg-white/10 hover:text-amber-50 backdrop-blur-sm flex-1 text-sm md:text-base rounded-md px-4 py-2 flex items-center justify-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {newTribute.photo ? "Change" : "Upload Photo"}
                      </button>
                      {newTribute.photo && (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 border-amber-300/30">
                          <Image
                            src={newTribute.photo}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            width={48}
                            height={48}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="font-body text-amber-200/80 text-sm mb-2 block">
                      Your Message *
                    </label>
                    <textarea
                      value={newTribute.message}
                      onChange={(e) => setNewTribute({ ...newTribute, message: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-amber-100 placeholder-amber-100/50 backdrop-blur-sm min-h-[100px] md:min-h-[120px] text-sm md:text-base rounded-md px-3 py-2"
                      placeholder="Share your favorite memory or message..."
                    />
                  </div>

                  {/* Offering Selection */}
                  <div>
                    <label className="font-body text-amber-200/80 text-sm mb-3 block">
                      Choose Your Offering
                    </label>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {(["candle", "flower", "heart"] as const).map((offering) => (
                        <button
                          key={offering}
                          type="button"
                          onClick={() => setNewTribute({ ...newTribute, offering })}
                          className={`p-3 md:p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 flex flex-col items-center ${
                            newTribute.offering === offering
                              ? "border-amber-300 bg-amber-500/20 scale-105"
                              : "border-white/20 bg-white/5 hover:bg-white/10 hover:scale-102"
                          }`}
                        >
                          <div className="text-xl md:text-2xl mb-1">
                            {getOfferingIcon(offering)}
                          </div>
                          <span className="font-body text-amber-100 text-xs md:text-sm capitalize">
                            {offering}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitTribute}
                    disabled={isSubmitting}
                    className={`w-full ${getOfferingButtonColor(newTribute.offering)} text-amber-100 font-body font-semibold py-4 md:py-6 text-base md:text-lg transition-all duration-300 hover:scale-105 shadow-2xl backdrop-blur-sm border rounded-md flex items-center justify-center disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-amber-100 mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>{getOfferingIcon(newTribute.offering)} Send Tribute</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tributes Display */}
            <div className="space-y-4 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 md:pr-2">
              {isLoading ? (
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/15 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-300 animate-spin mb-3" />
                  <p className="font-body text-amber-100/70 text-sm">Loading tributes...</p>
                </div>
              ) : tributes.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 border border-white/15 text-center">
                  <Heart className="w-12 h-12 text-amber-300/50 mx-auto mb-4" />
                  <h4 className="font-heading text-lg text-amber-100 mb-2">No Tributes Yet</h4>
                  <p className="font-body text-amber-100/60 text-sm">
                    Be the first to share a loving tribute
                  </p>
                </div>
              ) : (
                tributes.map((tribute) => (
                  <div
                    key={tribute.id}
                    className={`backdrop-blur-xl ${getOfferingColor(tribute.offering)} rounded-xl md:rounded-2xl p-4 md:p-6 border shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-101`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        {tribute.photo ? (
                          <Image
                            src={tribute.photo}
                            alt={tribute.name}
                            className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover border-2 border-amber-300/30 shadow-lg flex-shrink-0"
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-amber-400/20 flex items-center justify-center border-2 border-amber-300/30 shadow-lg flex-shrink-0">
                            <User className="w-3 h-3 md:w-5 md:h-5 text-amber-300" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-body font-semibold text-amber-100 text-sm md:text-base truncate">
                            {tribute.name}
                          </h4>
                          <p className="font-body text-amber-200/60 text-xs md:text-sm truncate">
                            {tribute.relationship}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-lg md:text-2xl">
                          {getOfferingIcon(tribute.offering)}
                        </div>
                        <p className="font-body text-amber-200/40 text-xs">{tribute.timestamp}</p>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-3 md:mb-4">
                      <p className="font-body text-amber-50/90 leading-relaxed text-sm md:text-base">
                        {tribute.isExpanded ? tribute.message : truncateMessage(tribute.message)}
                      </p>
                      {tribute.message.length > 120 && (
                        <button
                          onClick={() => toggleTributeExpand(tribute.id)}
                          className="flex items-center gap-1 mt-2 text-amber-300 hover:text-amber-200 transition-colors font-body text-xs md:text-sm"
                        >
                          {tribute.isExpanded ? (
                            <>
                              Show Less <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
                            </>
                          ) : (
                            <>
                              Read More <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Actions - Removed Like and Pray buttons */}
                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
                      <button
                        onClick={() => openTributeModal(tribute)}
                        className="flex items-center gap-1 md:gap-2 text-amber-200/70 hover:text-amber-100 transition-colors font-body text-xs md:text-sm"
                      >
                        <Share2 className="w-3 h-3 md:w-4 md:h-4" />
                        View Full
                      </button>
                      {/* Removed Like and Pray buttons section */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tribute Modal */}
      {selectedTribute && (
        <div
          className="fixed inset-0 bg-gradient-to-b from-[#3a4b2f]/90 via-[#2e3a25]/90 to-[#1f2615]/90 z-50 flex items-center justify-center p-2 md:p-4"
          onClick={closeTributeModal}
        >
          <div
            className="relative bg-gradient-to-b from-[#3a4b2f]/100 via-[#2e3a25]/100 to-[#1f2615]/100 rounded-2xl md:rounded-3xl w-full max-w-md md:max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden border border-amber-300/20 shadow-2xl backdrop-blur-xl mx-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-amber-300/20">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                {selectedTribute.photo ? (
                  <Image
                    src={selectedTribute.photo}
                    alt={selectedTribute.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-amber-300/30 flex-shrink-0"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-400/20 flex items-center justify-center border-2 border-amber-300/30 flex-shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-amber-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-body font-semibold text-amber-100 text-base md:text-lg truncate">
                    {selectedTribute.name}
                  </h3>
                  <p className="font-body text-amber-200/60 text-sm truncate">
                    {selectedTribute.relationship}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTributeModal}
                className="p-1 md:p-2 hover:bg-amber-300/10 rounded-full transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 md:w-6 md:h-6 text-amber-200" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-140px)] md:max-h-[calc(90vh-140px)]">
              {selectedTribute.photo && (
                <div className="mb-4 md:mb-6 rounded-lg md:rounded-xl overflow-hidden border border-amber-300/20 bg-black/20">
                  <Image
                    src={selectedTribute.photo}
                    alt="Memory photo"
                    className="w-full h-48 md:h-64 object-contain bg-black/10"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.objectFit = "cover";
                    }}
                    width={384}
                    height={256}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="text-2xl md:text-3xl">
                  {getOfferingIcon(selectedTribute.offering)}
                </div>
                <div>
                  <p className="font-body text-amber-200/60 text-sm">
                    Sent with a {selectedTribute.offering}
                  </p>
                  <p className="font-body text-amber-200/40 text-xs">{selectedTribute.timestamp}</p>
                </div>
              </div>

              <p className="font-body text-amber-50/90 leading-relaxed text-base md:text-lg whitespace-pre-wrap">
                {selectedTribute.message}
              </p>
            </div>

            {/* Footer - Removed Like and Pray buttons */}
            <div className="flex items-center justify-center p-4 md:p-6 border-t border-amber-300/20">
              <button
                className={`${getOfferingButtonColor(selectedTribute.offering)} text-amber-100 border rounded-md px-4 py-2 flex items-center`}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Tribute
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TributeSection;
