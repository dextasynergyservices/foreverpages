"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Trash2,
  Edit3,
  Grid3x3,
  Rows3,
  Search,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  description?: string;
  caption?: string;
  album?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  uploader: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface MediaGalleryProps {
  memorialId: string;
  type?: "IMAGE" | "VIDEO" | "ALL";
  editable?: boolean;
  showAlbums?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
  onMediaUpdate?: () => void;
}

type ViewMode = "grid" | "list";

export function MediaGallery({
  memorialId,
  type = "ALL",
  editable = false,
  showAlbums = true,
  columns = 3,
  className,
  onMediaUpdate,
}: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch media
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const typeParam = type !== "ALL" ? `?type=${type}` : "";
        const response = await fetch(`/api/memorials/${memorialId}/media${typeParam}`);
        const data = await response.json();

        if (data.success) {
          setMedia(data.data);
          setAlbums(data.albums || []);
        }
      } catch (error) {
        console.error("Failed to fetch media:", error);
        alert("Failed to load media");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [memorialId, type]);

  // Filter media
  useEffect(() => {
    let filtered = media;

    // Filter by album
    if (selectedAlbum !== "all") {
      filtered = filtered.filter((m) => m.album === selectedAlbum);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.originalName.toLowerCase().includes(query) ||
          m.title?.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredMedia(filtered);
  }, [media, selectedAlbum, searchQuery]);

  // Prepare lightbox slides
  const lightboxSlides = filteredMedia.map((item) => {
    if (item.type === "VIDEO") {
      return {
        type: "video" as const,
        sources: [
          {
            src: item.url,
            type: item.mimeType,
          },
        ],
        poster: item.thumbnailUrl,
        width: item.width || 1920,
        height: item.height || 1080,
        title: item.title,
        description: item.description || item.caption,
      };
    }

    return {
      src: item.url,
      width: item.width || 1920,
      height: item.height || 1080,
      title: item.title,
      description: item.description || item.caption,
    };
  });

  // Delete media
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/media/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Media deleted successfully");
        setMedia((prev) => prev.filter((m) => m.id !== id));
        setDeleteConfirm(null);
        onMediaUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete media");
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Failed to delete media");
    }
  };

  // Update media
  const handleUpdate = async () => {
    if (!editingMedia) return;

    try {
      const response = await fetch(`/api/memorials/${memorialId}/media/${editingMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingMedia.title,
          description: editingMedia.description,
          caption: editingMedia.caption,
          album: editingMedia.album,
          tags: editingMedia.tags,
          isPublic: editingMedia.isPublic,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Media updated successfully");
        setMedia((prev) => prev.map((m) => (m.id === editingMedia.id ? result.data : m)));
        setEditingMedia(null);
        onMediaUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update media");
      }
    } catch (error) {
      console.error("Failed to update media:", error);
      alert("Failed to update media");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Album Filter */}
          {showAlbums && albums.length > 0 && (
            <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
              <SelectTrigger className="w-[180px]">
                <FolderOpen className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Albums</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album} value={album}>
                    {album}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <Rows3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          {type === "IMAGE" ? (
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          ) : type === "VIDEO" ? (
            <VideoIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          ) : (
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          )}
          <h3 className="mb-2 text-lg font-semibold">No media found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || selectedAlbum !== "all"
              ? "Try adjusting your filters"
              : "Upload your first media to get started"}
          </p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredMedia.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            columns === 2 && "grid-cols-2",
            columns === 3 && "grid-cols-2 md:grid-cols-3",
            columns === 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {filteredMedia.map((item, index) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {/* Media Thumbnail */}
              {item.type === "IMAGE" ? (
                <button
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="h-full w-full"
                >
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.title || item.originalName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={item.thumbnailUrl || "/placeholder-video.jpg"}
                    alt={item.title || item.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {Math.floor(item.duration / 60)}:
                      {(item.duration % 60).toString().padStart(2, "0")}
                    </div>
                  )}
                </button>
              )}

              {/* Actions Overlay */}
              {editable && (
                <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingMedia(item)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteConfirm(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Caption Overlay */}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-sm text-white line-clamp-2">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredMedia.length > 0 && (
        <div className="space-y-2">
          {filteredMedia.map((item, index) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              {/* Thumbnail */}
              <button
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
                className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-muted"
              >
                {item.type === "IMAGE" ? (
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={item.title || item.originalName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <>
                    <Image
                      src={item.thumbnailUrl || "/placeholder-video.jpg"}
                      alt={item.title || item.originalName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </>
                )}
              </button>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium">{item.title || item.originalName}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                )}
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  {item.type === "VIDEO" && item.duration && (
                    <span>
                      {Math.floor(item.duration / 60)}:
                      {(item.duration % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                  {item.width && item.height && (
                    <span>
                      {item.width} × {item.height}
                    </span>
                  )}
                  <span>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  {item.album && <span>Album: {item.album}</span>}
                </div>
              </div>

              {/* Actions */}
              {editable && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingMedia(item)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(item.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Video, Zoom, Captions]}
        video={{
          controls: true,
          playsInline: true,
        }}
      />

      {/* Edit Dialog */}
      {editingMedia && (
        <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Media</DialogTitle>
              <DialogDescription>Update media information and organization</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingMedia.title || ""}
                  onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingMedia.description || ""}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={editingMedia.caption || ""}
                  onChange={(e) =>
                    setEditingMedia({
                      ...editingMedia,
                      caption: e.target.value,
                    })
                  }
                  placeholder="Enter caption"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="album">Album</Label>
                <Input
                  id="album"
                  value={editingMedia.album || ""}
                  onChange={(e) => setEditingMedia({ ...editingMedia, album: e.target.value })}
                  placeholder="Enter album name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMedia(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Media</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this media? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
