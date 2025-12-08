"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Image from "next/image";

export interface GalleryItem {
  id: string;
  mediaId?: string;
  url: string;
  caption?: string;
  type: "image" | "video";
}

export interface GalleryData {
  items: GalleryItem[];
  layout?: "grid" | "masonry" | "carousel";
}

interface GalleryEditorProps {
  data: GalleryData;
  onChange: (data: GalleryData) => void;
  onOpenMediaPicker?: () => void;
}

export const GalleryEditor: React.FC<GalleryEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const { theme } = useTheme();
  const [selectedLayout, setSelectedLayout] = useState<"grid" | "masonry" | "carousel">(
    data.layout || "grid"
  );
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const handleLayoutChange = (layout: "grid" | "masonry" | "carousel") => {
    setSelectedLayout(layout);
    onChange({ ...data, layout });
  };

  const handleCaptionChange = (itemId: string, caption: string) => {
    const updatedItems = data.items.map((item) =>
      item.id === itemId ? { ...item, caption } : item
    );
    onChange({ ...data, items: updatedItems });
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = data.items.filter((item) => item.id !== itemId);
    onChange({ ...data, items: updatedItems });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Photo & Video Gallery</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Add photos and videos that celebrate their life
        </p>
      </div>

      {/* Layout Selection */}
      <div>
        <Label>Gallery Layout</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <button
            onClick={() => handleLayoutChange("grid")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedLayout === "grid"
                ? "border-blue-500 bg-blue-500/10"
                : theme === "dark"
                  ? "border-white/10 hover:border-white/20"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="grid grid-cols-2 gap-1 mb-2">
              <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded" />
            </div>
            <p className="text-xs font-medium">Grid</p>
          </button>

          <button
            onClick={() => handleLayoutChange("masonry")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedLayout === "masonry"
                ? "border-blue-500 bg-blue-500/10"
                : theme === "dark"
                  ? "border-white/10 hover:border-white/20"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="space-y-1 mb-2">
              <div className="h-6 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded" />
            </div>
            <p className="text-xs font-medium">Masonry</p>
          </button>

          <button
            onClick={() => handleLayoutChange("carousel")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedLayout === "carousel"
                ? "border-blue-500 bg-blue-500/10"
                : theme === "dark"
                  ? "border-white/10 hover:border-white/20"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="mb-2">
              <div className="h-16 bg-gray-400 dark:bg-gray-600 rounded" />
              <div className="flex justify-center gap-1 mt-1">
                <div className="h-1 w-4 bg-gray-400 dark:bg-gray-600 rounded" />
                <div className="h-1 w-4 bg-gray-400 dark:bg-gray-600 rounded" />
                <div className="h-1 w-4 bg-gray-400 dark:bg-gray-600 rounded" />
              </div>
            </div>
            <p className="text-xs font-medium">Carousel</p>
          </button>
        </div>
      </div>

      {/* Add Media Button */}
      <Button onClick={onOpenMediaPicker} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Photos/Videos from Gallery
      </Button>

      {/* Gallery Items */}
      <div className="space-y-4">
        {data.items.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <ImageIcon className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No media added yet</p>
            <p className={`text-xs mt-1 ${textMuted}`}>
              Click the button above to add photos and videos
            </p>
          </div>
        ) : (
          data.items.map((item) => (
            <div
              key={item.id}
              className={`flex gap-4 p-4 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              {/* Preview */}
              <div className="flex-shrink-0">
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.caption || "Gallery item"}
                    className="w-24 h-24 object-cover rounded"
                    width={96}
                    height={96}
                  />
                ) : (
                  <video src={item.url} className="w-24 h-24 object-cover rounded" />
                )}
              </div>

              {/* Caption Input */}
              <div className="flex-1">
                <Label htmlFor={`caption-${item.id}`}>Caption (Optional)</Label>
                <input
                  id={`caption-${item.id}`}
                  type="text"
                  placeholder="Add a caption..."
                  value={item.caption || ""}
                  onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-md border ${
                    theme === "dark"
                      ? "bg-black border-white/10 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveItem(item.id)}
                className={`self-start p-2 rounded-md transition-colors ${
                  theme === "dark"
                    ? "hover:bg-red-500/20 text-red-400"
                    : "hover:bg-red-100 text-red-600"
                }`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
