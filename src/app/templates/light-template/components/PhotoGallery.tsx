"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Heart } from "lucide-react";
import { useTemplate } from "../TemplateProvider";
import { MediaLightbox, MediaItem } from "@/components/shared/MediaLightbox";

const defaultPhotos = [
  {
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=800&fit=crop",
    caption: "Early Years",
    year: "1952",
    description: "A bright beginning filled with hope and promise",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=800&fit=crop",
    caption: "Family Time",
    year: "1975",
    description: "Cherished moments with loved ones",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&h=800&fit=crop",
    caption: "Achievements",
    year: "1982",
    description: "Celebrating professional milestones",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&h=800&fit=crop",
    caption: "Golden Years",
    year: "1995",
    description: "Wisdom and grace in later life",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=800&fit=crop",
    caption: "Celebrations",
    year: "2000",
    description: "Joyous occasions with family and friends",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1543269664-7eef42226a21?w=600&h=800&fit=crop",
    caption: "Special Moments",
    year: "2010",
    description: "Precious memories that last forever",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=600&h=800&fit=crop",
    caption: "Cherished Memories",
    year: "2015",
    description: "The legacy of love continues",
    type: "image" as const,
  },
  {
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop",
    caption: "Forever Remembered",
    year: "2024",
    description: "Eternal peace and loving memory",
    type: "image" as const,
  },
];

const PhotoGallery = () => {
  const { sectionsData } = useTemplate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Get GALLERY section data with fallbacks
  const galleryData = (sectionsData?.GALLERY as any) || {};

  let mediaItems: MediaItem[];
  if (galleryData.items && Array.isArray(galleryData.items)) {
    // New structure from GalleryEditor
    mediaItems = galleryData.items.map((item: any, index: number) => ({
      id: item.id || String(index),
      url: item.url,
      caption: item.caption || "",
      description: item.caption || "",
      type: item.type || "image",
    }));
  } else if (galleryData.photos && Array.isArray(galleryData.photos)) {
    // Old structure
    mediaItems = galleryData.photos.map((photo: any, index: number) => ({
      id: String(index),
      url: photo.url,
      caption: photo.caption || "",
      description: photo.description || photo.caption || "",
      type: photo.type || "image",
    }));
  } else {
    // Fallback to default
    mediaItems = defaultPhotos.map((photo, index) => ({
      id: String(index),
      url: photo.url,
      caption: photo.caption,
      description: photo.description,
      type: photo.type,
    }));
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <>
      <section id="gallery" className="relative py-20 px-4 md:px-8">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
              backgroundImage: `url(https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166670/water-bg_vugsnw.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              backgroundAttachment: "fixed",
            }}
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-20 bg-primary/30"></div>
              <h2 className="font-script text-2xl md:text-6xl text-gold">Treasured Moments</h2>
              <div className="h-px w-20 bg-primary/30"></div>
            </div>
            <p className="text-foreground/70 text-lg italic max-w-2xl mx-auto">
              A visual journey through a life filled with love, faith, and beautiful memories
            </p>
          </div>

          {/* Media Grid */}
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {mediaItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group cursor-pointer relative overflow-hidden rounded-xl"
                  onClick={() => openLightbox(index)}
                >
                  {/* Main Media Container */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                    {item.type === "image" ? (
                      <Image
                        src={item.url}
                        alt={item.caption}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        fill
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
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                            <Play className="h-8 w-8 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                      {/* Media Type Badge */}
                      <div className="inline-flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 mb-3">
                        <Heart className="h-3 w-3 text-primary fill-primary" />
                        <span className="text-primary text-sm font-semibold">
                          {item.type === "video" ? "Video" : "Photo"}
                        </span>
                      </div>

                      {/* Caption */}
                      <h3 className="text-white font-heading text-lg mb-2">{item.caption}</h3>

                      {/* Description */}
                      {item.description && item.description !== item.caption && (
                        <p className="text-white/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Golden Frame Effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-xl transition-all duration-500" />
                  </div>

                  {/* Floating Shadow Effect */}
                  <div className="absolute inset-0 rounded-xl shadow-2xl shadow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-primary/30 mx-auto mb-4" />
              <p className="text-foreground/50">
                No photos or videos have been added to this memorial yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Professional Lightbox */}
      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        items={mediaItems}
        initialIndex={lightboxIndex}
        showNavigation={true}
        showCaptions={true}
      />
    </>
  );
};

export default PhotoGallery;
