"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

// Media item type supporting both images and videos
interface MediaItem {
  id: string;
  url: string;
  caption: string;
  description?: string;
  type: "image" | "video";
}

// Default media items for preview
const defaultMedia: MediaItem[] = [
  {
    id: "1",
    url: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764853741/as-a-child1_xlhhb2.png",
    caption: "Childhood",
    description: "Early years filled with joy",
    type: "image",
  },
  {
    id: "2",
    url: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683419/memory4_i3nrkz.png",
    caption: "Wedding Day",
    description: "A beautiful union of love",
    type: "image",
  },
  {
    id: "3",
    url: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764852092/family_pzt4mm.png",
    caption: "Family Time",
    description: "Cherished moments with loved ones",
    type: "image",
  },
  {
    id: "4",
    url: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764853552/celebration1_blnmox.png",
    caption: "Celebration",
    description: "Joyous occasions together",
    type: "image",
  },
  {
    id: "5",
    url: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764852176/thomas1_itt2fo.png",
    caption: "Recent Years",
    description: "Beautiful golden years",
    type: "image",
  },
  {
    id: "6",
    url: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764854848/cherished2_bn4jvn.png",
    caption: "Cherished Moments",
    description: "Memories that last forever",
    type: "image",
  },
];

const PhotoGallery = () => {
  const { sectionsData } = useTemplate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get GALLERY section data with fallbacks (same pattern as light-template)
  const galleryData = (sectionsData?.GALLERY as Record<string, unknown>) || {};

  let mediaItems: MediaItem[];
  if (galleryData.items && Array.isArray(galleryData.items) && galleryData.items.length > 0) {
    // New structure from GalleryEditor
    mediaItems = (galleryData.items as Record<string, unknown>[]).map((item, index: number) => ({
      id: (item.id as string) || String(index),
      url: item.url as string,
      caption: (item.caption as string) || "",
      description: (item.caption as string) || "",
      type: (item.type as "image" | "video") || "image",
    }));
  } else if (
    galleryData.photos &&
    Array.isArray(galleryData.photos) &&
    galleryData.photos.length > 0
  ) {
    // Old structure
    mediaItems = (galleryData.photos as Record<string, unknown>[]).map((photo, index: number) => ({
      id: String(index),
      url: photo.url as string,
      caption: (photo.caption as string) || "",
      description: (photo.description as string) || (photo.caption as string) || "",
      type: (photo.type as "image" | "video") || "image",
    }));
  } else {
    // Fallback to default preview data
    mediaItems = defaultMedia;
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
  };

  const currentItem = mediaItems[currentIndex];

  return (
    <>
      <section id="photos" className="relative py-20 px-4 text-white overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764852706/thomas2_sgyf6j.png)`,
          }}
        ></div>

        {/* Light green gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/70 via-[#2e3a25]/90 to-[#1f2615]/80 z-0"></div>

        {/* Enhanced soft light overlay for sunlight glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252,228,181,0.15),transparent_60%)] pointer-events-none z-0"></div>

        {/* Additional gradient for smoother transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>

        <div className="relative container mx-auto max-w-6xl z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-amber-100 animate-fade-in-up">
              Sacred Memories
            </h2>
            <p className="text-amber-100/70 mt-4 text-lg italic max-w-2xl mx-auto">
              A visual journey through a life filled with love, faith, and beautiful memories
            </p>
          </div>

          {/* Media Grid */}
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => openLightbox(index)}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden backdrop-blur-md bg-white/10 border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all duration-300 cursor-pointer animate-fade-in-up hover:scale-105 hover:border-amber-300/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Media Content */}
                  {item.type === "image" ? (
                    <Image
                      src={item.url}
                      alt={item.caption || "Gallery image"}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        muted
                        preload="metadata"
                      />
                      {/* Video Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-amber-400/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-amber-400/30 transition-all duration-300 border border-amber-300/30">
                          <Play className="h-8 w-8 text-amber-100 ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {/* Media Type Badge */}
                    <div className="inline-flex items-center gap-2 bg-amber-400/20 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-300/30 mb-2">
                      <Heart className="h-3 w-3 text-amber-300 fill-amber-300" />
                      <span className="text-amber-100 text-xs font-semibold">
                        {item.type === "video" ? "Video" : "Photo"}
                      </span>
                    </div>

                    {/* Caption */}
                    <h3 className="text-amber-100 font-heading text-lg font-semibold">
                      {item.caption}
                    </h3>

                    {/* Description */}
                    {item.description && item.description !== item.caption && (
                      <p className="text-amber-100/70 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Hover overlay effect */}
                  <div className="absolute inset-0 bg-amber-100/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-amber-300/30 mx-auto mb-4" />
              <p className="text-amber-100/50">
                No photos or videos have been added to this memorial yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && currentItem && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation - Previous */}
            {mediaItems.length > 1 && (
              <button
                onClick={goToPrev}
                className="absolute left-4 z-20 p-3 bg-amber-300/10 hover:bg-amber-300/20 rounded-full transition-all border border-amber-300/30"
              >
                <ChevronLeft className="w-8 h-8 text-amber-200" />
              </button>
            )}

            {/* Navigation - Next */}
            {mediaItems.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 z-20 p-3 bg-amber-300/10 hover:bg-amber-300/20 rounded-full transition-all border border-amber-300/30"
              >
                <ChevronRight className="w-8 h-8 text-amber-200" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-20 p-3 bg-amber-300/10 hover:bg-amber-300/20 rounded-full transition-all border border-amber-300/30"
            >
              <X className="w-6 h-6 text-amber-200" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-20 bg-amber-300/10 px-4 py-2 rounded-full border border-amber-300/30">
              <span className="font-body text-amber-200 text-sm">
                {currentIndex + 1} / {mediaItems.length}
              </span>
            </div>

            {/* Media Content */}
            <div className="relative max-w-5xl w-full max-h-[80vh]">
              {currentItem.type === "image" ? (
                <div className="relative w-full h-[70vh]">
                  <Image
                    src={currentItem.url}
                    alt={currentItem.caption || "Gallery image"}
                    fill
                    className="object-contain rounded-lg"
                    sizes="100vw"
                  />
                </div>
              ) : (
                <video
                  src={currentItem.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg"
                />
              )}

              {/* Caption */}
              {currentItem.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <h3 className="text-amber-100 font-heading text-xl font-semibold text-center">
                    {currentItem.caption}
                  </h3>
                  {currentItem.description && currentItem.description !== currentItem.caption && (
                    <p className="text-amber-100/70 text-center mt-2">{currentItem.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
