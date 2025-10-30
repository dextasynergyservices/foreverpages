"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Video } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/hooks/useTheme";

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

interface MediaCardProps {
  item: MediaItem;
  onDelete: (id: number) => void;
  onSelect: (media: MediaItem) => void;
  themeClasses?: ThemeClasses;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onDelete, onSelect }) => {
  const { theme } = useTheme();

  // Prefer runtime theme via useTheme for consistent behavior.
  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";

  return (
    <Card className={`overflow-hidden border ${cardBorder} ${cardBg} p-0`}>
      <CardContent className="p-0">
        {/* remove background color behind thumbnail; image will fill the card */}
        <div className={`aspect-square relative group`}>
          <Image src={item.url} alt={item.title} fill className="object-cover" sizes="300px" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant={cardBg === "bg-black" ? "memorial-ghost" : "outline"}
              size="sm"
              onClick={() => onSelect(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {item.type === "video" && (
            <div className="absolute top-2 right-2">
              <Video className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-0">
        <div className="w-full px-3 py-2">
          <p className="text-sm font-medium">{item.title}</p>
        </div>
      </CardFooter>
    </Card>
  );
};
