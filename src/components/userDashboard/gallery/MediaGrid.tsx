import React from "react";
import { MediaCard } from "./MediaCard";

interface MediaItem {
  id: number;
  url: string;
  title: string;
  type: "image" | "video";
}

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
  bgMuted: string;
}

interface MediaGridProps {
  photos: MediaItem[];
  onDelete: (id: number) => void;
  onSelectMedia: (media: MediaItem) => void;
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  photos,
  onDelete,
  onSelectMedia,
  themeClasses,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
      {photos.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          onSelect={onSelectMedia}
          themeClasses={themeClasses}
        />
      ))}
    </div>
  );
};
