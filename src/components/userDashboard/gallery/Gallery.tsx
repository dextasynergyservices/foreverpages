"use client";

import React, { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { GalleryHeader } from "./GalleryHeader";
import { MediaGrid } from "./MediaGrid";
import { MediaLightbox } from "./MediaLightbox";
import { UploadCard } from "./UploadCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadForm } from "./UploadForm";

interface MediaItem {
  id: number;
  url: string;
  title: string;
  type: "image" | "video";
}

const Gallery = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [photos, setPhotos] = useState<MediaItem[]>([
    { id: 1, url: "/memorial-background.jpg", title: "Family Gathering", type: "image" },
    { id: 2, url: "/hero-memorial.jpg", title: "Wedding Day", type: "image" },
  ]);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const handleDelete = (id: number) => {
    setPhotos(photos.filter((photo) => photo.id !== id));
  };

  const themeClasses = {
    cardBorder: theme === "dark" ? "border-white/10" : "border-gray-200",
    cardBg: theme === "dark" ? "bg-black" : "bg-white",
    textMuted: theme === "dark" ? "text-white/70" : "text-gray-600",
    bgMuted: theme === "dark" ? "bg-white/5" : "bg-gray-100",
  };

  // Create a type-safe wrapper for the t function
  const safeT = (key: string, params?: unknown, fallback?: string): string => {
    return t(key, params as Record<string, string | number> | undefined, fallback);
  };

  return (
    <>
      <Dialog>
        <div
          className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} relative`}
        >
          <GalleryHeader theme={theme} t={safeT} externalDialog />

          <MediaGrid
            photos={photos}
            onDelete={handleDelete}
            onSelectMedia={setSelectedMedia}
            themeClasses={themeClasses}
            t={safeT}
          />

          {/* Upload Card placed separately */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <UploadCard themeClasses={themeClasses} t={safeT} externalDialog />
          </div>

          {/* Shared Dialog content used by both header and upload card triggers */}
          <DialogContent
            className={`max-w-md ${theme === "dark" ? "bg-black text-white border-white/10" : "bg-white text-black border-gray-200"} z-50`}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {safeT("dashboard.gallery.uploadDialogTitle")}
              </DialogTitle>
            </DialogHeader>
            <UploadForm t={safeT} formId="" />
          </DialogContent>
        </div>
      </Dialog>

      <MediaLightbox
        selectedMedia={selectedMedia}
        photos={photos}
        onSelect={(m) => setSelectedMedia(m)}
        onClose={() => setSelectedMedia(null)}
        theme={theme}
      />
    </>
  );
};

export default Gallery;
