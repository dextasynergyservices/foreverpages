"use client";

import { useState, useEffect } from "react";
import { Play, Camera, Video } from "lucide-react";
import { useTemplate } from "../TemplateProvider";
import { MediaLightbox, MediaItem } from "@/components/shared/MediaLightbox";

export const GalleryModern = () => {
  const { sectionsData } = useTemplate();

  // Get GALLERY section data with fallbacks
  const galleryData = (sectionsData?.GALLERY as any) || {};
  const defaultPhotos = [
    {
      id: 1,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683428/memory8_y7fruu.png",
      tag: "Family",
      year: "2020",
      type: "image",
    },
    {
      id: 2,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683424/memory12_qgyxxm.png",
      tag: "Travel",
      year: "1975",
      type: "image",
    },
    {
      id: 3,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683421/memory11_mos2g5.png",
      tag: "Travel",
      year: "1972",
      type: "image",
    },
    {
      id: 4,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683419/memory4_i3nrkz.png",
      tag: "Celebrations",
      year: "1969",
      type: "image",
    },
    {
      id: 5,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683419/memory7_n3ji76.png",
      tag: "Grandchildren",
      year: "2022",
      type: "image",
    },
    {
      id: 6,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683409/memory6_mgveyg.png",
      tag: "Hobbies",
      year: "2015",
      type: "image",
    },
    {
      id: 7,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683405/memory5_imwwmj.png",
      tag: "Nature",
      year: "1968",
      type: "image",
    },
    {
      id: 8,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683402/memory2_jqezdm.png",
      tag: "Friends",
      year: "1970",
      type: "image",
    },
    {
      id: 9,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683393/memory10_vxbby5.png",
      tag: "Events",
      year: "2021",
      type: "image",
    },
    {
      id: 10,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683394/memory9_yuhuvw.png",
      tag: "Travel",
      year: "1963",
      type: "image",
    },
    {
      id: 11,
      src: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764683388/memory1_byflff.png",
      tag: "Family",
      year: "2016",
      type: "image",
    },
  ];

  // Transform data to MediaItem format
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
      url: photo.src || photo.url,
      caption: photo.tag || photo.caption || "",
      description: `${photo.tag || ""} • ${photo.year || ""}`,
      type: photo.type || "image",
    }));
  } else {
    // Fallback to default
    mediaItems = defaultPhotos.map((photo) => ({
      id: String(photo.id),
      url: photo.src,
      caption: photo.tag,
      description: `${photo.tag} • ${photo.year}`,
      type: photo.type as "image" | "video",
    }));
  }

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination configuration
  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(mediaItems.length / ITEMS_PER_PAGE);

  // Get current items to display
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = mediaItems.slice(startIndex, endIndex);

  const openLightbox = (index: number) => {
    const globalIndex = startIndex + index;
    setSelectedIndex(globalIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Reset to page 1 when component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  // Section content from sectionsData
  const sectionTitle = galleryData.title || "Cherished Memories";
  const sectionSubtitle = galleryData.subtitle || "Moments that made life beautiful";

  return (
    <>
      <section
        id="photos"
        className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 animate-fade-in text-center">
            <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
              {sectionTitle}
            </h2>
            <p className="text-cream/80">{sectionSubtitle}</p>
          </div>

          {/* Enhanced Media Grid */}
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl shadow-soft transition-smooth hover:shadow-hover"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => openLightbox(index)}
                >
                  {/* Media Container */}
                  <div className="relative h-72 w-full">
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.caption}
                        className="h-full w-full object-cover transition-smooth group-hover:scale-110"
                      />
                    ) : (
                      <div className="relative h-full w-full">
                        <video
                          src={item.url}
                          className="h-full w-full object-cover transition-smooth group-hover:scale-110"
                          muted
                          preload="metadata"
                        />
                        {/* Video Play Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
                            <Play className="ml-1 h-10 w-10 text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Media Type Icon */}
                    <div className="absolute right-3 top-3 rounded-full bg-black/50 p-2 opacity-80">
                      {item.type === "image" ? (
                        <Camera className="h-4 w-4 text-white" />
                      ) : (
                        <Video className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Enhanced Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-smooth group-hover:opacity-100">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-celebration-charcoal">
                          {item.caption}
                        </span>
                        <span className="font-medium text-white text-sm">
                          {item.type === "video" ? "Video" : "Photo"}
                        </span>
                      </div>
                      {item.description && item.description !== item.caption && (
                        <p className="mt-2 text-sm text-white/90 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-white/10 p-6">
                  <Camera className="h-12 w-12 text-cream/50" />
                </div>
              </div>
              <p className="text-cream/60 text-lg">No photos or videos have been added yet.</p>
            </div>
          )}

          {/* Enhanced Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex animate-fade-in items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-cream transition-smooth hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-medium transition-smooth ${
                    currentPage === page
                      ? "bg-white text-burgundy shadow-lg"
                      : "bg-white/10 text-cream hover:bg-white/20"
                  }`}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-cream transition-smooth hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Professional Lightbox */}
      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        items={mediaItems}
        initialIndex={selectedIndex}
        showNavigation={true}
        showCaptions={true}
      />
    </>
  );
};
