"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserUploads, UserUpload } from "@/hooks/useUserUploads";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Search, Check, Image as ImageIcon, Video, AlertCircle } from "lucide-react";
import Image from "next/image";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedMedia: UserUpload[]) => void;
  allowMultiple?: boolean;
  filterType?: "IMAGE" | "VIDEO" | null;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  open,
  onOpenChange,
  onSelect,
  allowMultiple = true,
  filterType = null,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<"IMAGE" | "VIDEO" | "ALL">(filterType || "ALL");

  // Fetch uploads based on active type
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useUserUploads({
    type: activeType === "ALL" ? null : activeType,
    search: searchQuery,
    limit: 50,
  });

  const uploads = response?.data?.uploads || [];
  const plan = response?.data?.plan;

  const handleToggleSelect = (upload: UserUpload) => {
    const newSelectedIds = new Set(selectedIds);

    if (newSelectedIds.has(upload.id)) {
      newSelectedIds.delete(upload.id);
    } else {
      if (!allowMultiple) {
        newSelectedIds.clear();
      }
      newSelectedIds.add(upload.id);
    }

    setSelectedIds(newSelectedIds);
  };

  const handleConfirmSelection = () => {
    const selectedMedia = uploads.filter((upload) => selectedIds.has(upload.id));
    onSelect(selectedMedia);
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-black" : "bg-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.pageBuilder.mediaPicker.title", {}, "Select Media from Gallery")}
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t(
              "dashboard.pageBuilder.mediaPicker.searchPlaceholder",
              {},
              "Search by title or description..."
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${inputBg} ${cardBorder}`}
          />
        </div>

        {/* Type Filter Tabs */}
        {!filterType && (
          <Tabs
            value={activeType}
            onValueChange={(value) => setActiveType(value as "IMAGE" | "VIDEO" | "ALL")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ALL">
                {t("dashboard.pageBuilder.mediaPicker.all", {}, "All")}
              </TabsTrigger>
              <TabsTrigger value="IMAGE">
                <ImageIcon className="h-4 w-4 mr-2" />
                {t("dashboard.pageBuilder.mediaPicker.images", {}, "Images")}
              </TabsTrigger>
              <TabsTrigger value="VIDEO">
                <Video className="h-4 w-4 mr-2" />
                {t("dashboard.pageBuilder.mediaPicker.videos", {}, "Videos")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Plan Limits Info */}
        {plan && (
          <div className={`text-xs ${textMuted} flex gap-4`}>
            <span>
              {t("dashboard.pageBuilder.mediaPicker.imagesUsed", {}, "Images:")}{" "}
              {plan.limits.images.used}/{plan.limits.images.max}
            </span>
            <span>
              {t("dashboard.pageBuilder.mediaPicker.videosUsed", {}, "Videos:")}{" "}
              {plan.limits.videos.used}/{plan.limits.videos.max}
            </span>
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className={`h-12 w-12 mb-3 ${textMuted}`} />
              <p className={textMuted}>
                {t("dashboard.pageBuilder.mediaPicker.error", {}, "Failed to load media")}
              </p>
              <p className="text-xs text-red-500 mt-1">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className={`h-12 w-12 mb-3 ${textMuted}`} />
              <p className={textMuted}>
                {t("dashboard.pageBuilder.mediaPicker.noMedia", {}, "No media found")}
              </p>
              <p className={`text-xs mt-1 ${textMuted}`}>
                {t(
                  "dashboard.pageBuilder.mediaPicker.uploadFirst",
                  {},
                  "Upload some media to your gallery first"
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploads.map((upload) => {
                const isSelected = selectedIds.has(upload.id);

                return (
                  <button
                    key={upload.id}
                    onClick={() => handleToggleSelect(upload)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/50"
                        : `${cardBorder} hover:border-blue-300`
                    }`}
                  >
                    {/* Media Preview */}
                    {upload.type === "IMAGE" ? (
                      <Image
                        src={upload.thumbnailUrl || upload.url}
                        alt={upload.title || upload.originalName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={upload.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {upload.title || upload.originalName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className={`text-sm ${textMuted}`}>
            {selectedIds.size} {t("dashboard.pageBuilder.mediaPicker.selected", {}, "selected")}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t("common.cancel", {}, "Cancel")}
            </Button>
            <Button onClick={handleConfirmSelection} disabled={selectedIds.size === 0}>
              {t("dashboard.pageBuilder.mediaPicker.addSelected", {}, "Add Selected")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
