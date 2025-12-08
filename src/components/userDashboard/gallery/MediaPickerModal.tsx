"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Check, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  title?: string;
  originalName: string;
  type: "IMAGE" | "VIDEO";
  sortOrder?: number | null;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mediaIds: string[]) => void;
  multiple?: boolean;
  filter?: "IMAGE" | "VIDEO" | "ALL";
  selectedIds?: string[];
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onClose,
  onSelect,
  multiple = false,
  filter = "ALL",
  selectedIds = [],
}) => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [activeTab, setActiveTab] = useState<"IMAGE" | "VIDEO" | "ALL">(filter);

  // Fetch media from user's gallery
  const { data: mediaResponse, isLoading } = useQuery({
    queryKey: ["media-picker"],
    queryFn: async () => {
      const res = await fetch("/api/user/media?limit=100");
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
    enabled: open,
  });

  const media: MediaItem[] = useMemo(
    () => mediaResponse?.data?.uploads || [],
    [mediaResponse?.data?.uploads]
  );

  // Filter media based on search, tab, and filter prop
  const filteredMedia = useMemo(() => {
    let result = media;

    // Apply filter prop (permanent filter)
    if (filter !== "ALL") {
      result = result.filter((m) => m.type === filter);
    }

    // Apply tab filter (user-controlled)
    if (activeTab !== "ALL") {
      result = result.filter((m) => m.type === activeTab);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.originalName.toLowerCase().includes(query) ||
          (m.title?.toLowerCase() || "").includes(query)
      );
    }

    return result;
  }, [media, filter, activeTab, searchQuery]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (multiple) {
        newSelected.add(id);
      } else {
        newSelected.clear();
        newSelected.add(id);
      }
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onClose();
  };

  const handleCancel = () => {
    setSelected(new Set(selectedIds));
    onClose();
  };

  // Theme-aware styles
  const bgColor = theme === "light" ? "bg-white" : "bg-gray-900";
  const textColor = theme === "light" ? "text-gray-900" : "text-gray-100";
  const mutedText = theme === "light" ? "text-gray-500" : "text-gray-400";
  const borderColor = theme === "light" ? "border-gray-200" : "border-gray-700";
  const hoverBg = theme === "light" ? "hover:bg-gray-50" : "hover:bg-gray-800";

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className={`max-w-5xl max-h-[90vh] ${bgColor} ${textColor}`}>
        <DialogHeader>
          <DialogTitle>{multiple ? "Select Media" : "Select a Media Item"}</DialogTitle>
          <DialogDescription className={mutedText}>
            {multiple
              ? "Choose one or more items from your gallery"
              : "Choose an item from your gallery"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("dashboard.gallery.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs for filtering by type (only if filter is ALL) */}
          {filter === "ALL" && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ALL">{t("dashboard.gallery.all")}</TabsTrigger>
                <TabsTrigger value="IMAGE">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {t("dashboard.gallery.photos")}
                </TabsTrigger>
                <TabsTrigger value="VIDEO">
                  <VideoIcon className="w-4 h-4 mr-2" />
                  {t("dashboard.gallery.videos")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Media Grid */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className={`text-lg font-medium ${mutedText}`}>
                  {searchQuery ? "No matching media found" : t("dashboard.gallery.empty")}
                </p>
                <p className={`text-sm ${mutedText} mt-2`}>
                  {searchQuery ? "Try adjusting your search" : t("dashboard.gallery.emptyDesc")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMedia.map((item) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : `${hoverBg} ${borderColor}`
                      }`}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <CardContent className="p-0 relative aspect-square">
                        {item.type === "IMAGE" ? (
                          <Image
                            src={item.thumbnailUrl || item.url}
                            alt={item.title || item.originalName}
                            fill
                            className="object-cover rounded-md"
                            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
                            <VideoIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-md">
                            <div className="bg-primary text-white rounded-full p-1">
                              <Check className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Selection count */}
          {multiple && selected.size > 0 && (
            <p className={`text-sm ${mutedText}`}>
              {selected.size} {selected.size === 1 ? "item" : "items"} selected
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            {multiple ? `Select ${selected.size > 0 ? `(${selected.size})` : ""}` : "Select"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
