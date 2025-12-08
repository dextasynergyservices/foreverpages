/* eslint-disable jsx-a11y/alt-text */
"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface PhotoAlbum {
  id: string;
  title: string;
  description?: string;
  photos: Array<{
    id: string;
    url: string;
    caption?: string;
  }>;
}

export interface PhotoAlbumData {
  albums: PhotoAlbum[];
}

interface PhotoAlbumEditorProps {
  data: PhotoAlbumData;
  onChange: (data: PhotoAlbumData) => void;
  onOpenMediaPicker?: () => void;
}

export const PhotoAlbumEditor: React.FC<PhotoAlbumEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addAlbum = () => {
    const newAlbum: PhotoAlbum = {
      id: `album-${Date.now()}`,
      title: "",
      description: "",
      photos: [],
    };
    onChange({ albums: [...data.albums, newAlbum] });
  };

  const updateAlbum = (albumId: string, field: keyof PhotoAlbum, value: string) => {
    const updatedAlbums = data.albums.map((album) =>
      album.id === albumId ? { ...album, [field]: value } : album
    );
    onChange({ albums: updatedAlbums });
  };

  const removeAlbum = (albumId: string) => {
    const updatedAlbums = data.albums.filter((album) => album.id !== albumId);
    onChange({ albums: updatedAlbums });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Photo Albums</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>Organize photos into themed albums</p>
      </div>

      <Button onClick={addAlbum} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Create New Album
      </Button>

      <div className="space-y-6">
        {data.albums.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Image className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No photo albums created yet</p>
          </div>
        ) : (
          data.albums.map((album) => (
            <div
              key={album.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Image className="h-5 w-5 text-blue-500" />
                <button
                  onClick={() => removeAlbum(album.id)}
                  className={`p-2 rounded-md transition-colors ${
                    theme === "dark"
                      ? "hover:bg-red-500/20 text-red-400"
                      : "hover:bg-red-100 text-red-600"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`album-title-${album.id}`}>Album Title *</Label>
                  <Input
                    id={`album-title-${album.id}`}
                    placeholder="e.g., Family Gatherings, Travels, Early Years"
                    value={album.title}
                    onChange={(e) => updateAlbum(album.id, "title", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`album-description-${album.id}`}>Description (Optional)</Label>
                  <Textarea
                    id={`album-description-${album.id}`}
                    placeholder="Describe this collection of photos..."
                    rows={2}
                    value={album.description || ""}
                    onChange={(e) => updateAlbum(album.id, "description", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Photos in Album ({album.photos.length})</Label>
                  <button
                    onClick={onOpenMediaPicker}
                    className={`w-full mt-2 py-8 border-2 border-dashed rounded-lg transition-colors ${
                      theme === "dark"
                        ? "border-white/10 hover:border-white/20"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Image className={`h-8 w-8 mx-auto mb-2 ${textMuted}`} />
                    <p className={textMuted}>Click to add photos from gallery</p>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
