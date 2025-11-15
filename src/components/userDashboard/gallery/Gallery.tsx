"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { PlanLimitsCard } from "./PlanLimitsCard";
import { MediaLightbox } from "./MediaLightbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  MoreVertical,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  X,
  CheckCircle2,
  Download,
  Grid3x3,
  List,
  ArrowUpDown,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  title?: string;
  originalName: string;
  type: "IMAGE" | "VIDEO";
  memorial?: {
    id: string;
    name: string;
  };
}

interface PlanLimitsData {
  name: string;
  limits: {
    images: {
      used: number;
      max: number;
      remaining: number;
      percentage: number;
    };
    videos: {
      used: number;
      max: number;
      remaining: number;
      percentage: number;
    };
  };
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  eager?: Array<{ secure_url: string }>;
  [key: string]: unknown;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
  uploadedData?: {
    url: string;
    publicId: string;
    thumbnailUrl?: string;
  };
}

const Gallery = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name" | "type" | "size">("date");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const isDark = theme === "dark";
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch user media with infinite query
  const {
    data: galleryResponse,
    isLoading: isLoadingMedia,
    error: mediaError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["user-media"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/user/media?page=${pageParam}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.pagination.hasMore ? lastPage.data.pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const media = React.useMemo(
    () => galleryResponse?.pages.flatMap((page) => page.data.uploads) || [],
    [galleryResponse?.pages]
  );
  const planData: PlanLimitsData | null = galleryResponse?.pages[0]?.data?.plan || null;

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Filter, search, and sort media
  const filteredMedia = React.useMemo(() => {
    let result = media;

    // Filter by type
    if (filterType !== "ALL") {
      result = result.filter((m: MediaItem) => m.type === filterType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m: MediaItem) =>
          m.originalName.toLowerCase().includes(query) ||
          (m.title?.toLowerCase() || "").includes(query)
      );
    }

    // Sort
    result = [...result].sort((a: MediaItem, b: MediaItem) => {
      switch (sortBy) {
        case "name":
          return (a.title || a.originalName).localeCompare(b.title || b.originalName);
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
        default:
          return 0; // Already sorted by date from API
      }
    });

    return result;
  }, [media, filterType, searchQuery, sortBy]);

  // Compress image if needed (>10MB)
  const compressImage = useCallback(async (file: File): Promise<File> => {
    const maxSizeMB = 10;
    const fileSizeMB = file.size / 1024 / 1024;

    if (fileSizeMB <= maxSizeMB) {
      return file;
    }

    try {
      const options = {
        maxSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Image compression error:", error);
      return file; // Return original if compression fails
    }
  }, []);

  // Upload directly to Cloudinary
  const uploadToCloudinary = useCallback(
    async (file: File, uploadFile: UploadingFile) => {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset =
        uploadType === "IMAGE"
          ? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_IMAGE
          : process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "foreverpages");

      return new Promise<CloudinaryResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded * 100) / e.total);
            setUploadingFiles((prev) =>
              prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
        xhr.send(formData);
      });
    },
    [uploadType]
  );

  // Handle file upload with compression and progress (no memorial required)
  const handleUpload = useCallback(
    async (files: File[]) => {
      const newFiles: UploadingFile[] = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Show upload started toast
      const uploadKey =
        files.length === 1
          ? "dashboard.gallery.uploadingSingle"
          : "dashboard.gallery.uploadingMultiple";
      toast.loading(t(uploadKey, { count: files.length }), {
        id: "upload-toast",
      });

      for (const uploadFile of newFiles) {
        try {
          // Compress image if needed
          let fileToUpload = uploadFile.file;
          if (uploadType === "IMAGE") {
            fileToUpload = await compressImage(uploadFile.file);
          }

          // Upload to Cloudinary with progress tracking
          const cloudinaryResult = await uploadToCloudinary(fileToUpload, uploadFile);

          // Generate proper thumbnail URL for videos
          let thumbnailUrl = cloudinaryResult.eager?.[0]?.secure_url || cloudinaryResult.secure_url;
          if (uploadType === "VIDEO") {
            // For videos, create a JPG thumbnail URL from Cloudinary
            const publicId = cloudinaryResult.public_id;
            thumbnailUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/c_fill,h_400,w_400,f_jpg/${publicId}.jpg`;
          }

          // Save to user's library (no memorial required)
          const response = await fetch("/api/user/library/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: uploadType,
              url: cloudinaryResult.secure_url,
              publicId: cloudinaryResult.public_id,
              thumbnailUrl,
              originalName: uploadFile.file.name,
              fileSize: cloudinaryResult.bytes,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              duration: cloudinaryResult.duration,
              format: cloudinaryResult.format,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            const newMediaItem: MediaItem = result.data;

            // Update status to success
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? {
                      ...f,
                      status: "success" as const,
                      progress: 100,
                      uploadedData: {
                        url: newMediaItem.url,
                        publicId: newMediaItem.publicId,
                        thumbnailUrl: newMediaItem.thumbnailUrl || newMediaItem.url,
                      },
                    }
                  : f
              )
            );

            // Refresh gallery data immediately
            await queryClient.invalidateQueries({ queryKey: ["user-media"] });
            // Reset the infinite query to refetch from the first page with updated counts
            await queryClient.resetQueries({ queryKey: ["user-media"] });

            // Success toast
            toast.success(t("dashboard.gallery.uploadSuccess", { name: uploadFile.file.name }), {
              id: "upload-toast",
            });

            // Clean up preview after delay
            setTimeout(() => {
              URL.revokeObjectURL(uploadFile.preview);
              setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
            }, 2000);
          } else {
            const error = await response.json();
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id ? { ...f, status: "error" as const, error: error.error } : f
              )
            );
            toast.error(error.error || t("dashboard.gallery.uploadFailed"), {
              id: "upload-toast",
            });
          }
        } catch (error) {
          console.error("Upload error:", error);
          const errorMessage = error instanceof Error ? error.message : "Upload failed";
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: "error" as const, error: errorMessage } : f
            )
          );
          toast.error(errorMessage, { id: "upload-toast" });
        }
      }
    },
    [uploadType, compressImage, uploadToCloudinary, queryClient, t]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: uploadType === "IMAGE" ? { "image/*": [] } : { "video/*": [] },
    onDrop: handleUpload,
    maxFiles: 10,
  });

  // Delete mutation with TanStack Query
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const mediaItem = media.find((m: MediaItem) => m.id === id);

      // Library media: no memorial ID required
      const endpoint = mediaItem?.memorial?.id
        ? `/api/memorials/${mediaItem.memorial.id}/media/${id}`
        : `/api/user/library/media/${id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete media");
      }

      return id;
    },
    onMutate: () => {
      // Show loading toast
      toast.loading(t("dashboard.gallery.deleting"), { id: "delete-toast" });
    },
    onSuccess: () => {
      // Refresh gallery data
      queryClient.invalidateQueries({ queryKey: ["user-media"] });
      toast.success(t("dashboard.gallery.deleteSuccess"), { id: "delete-toast" });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("dashboard.gallery.deleteFailed"), { id: "delete-toast" });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const deletePromises = ids.map(async (id) => {
        const mediaItem = media.find((m: MediaItem) => m.id === id);
        const endpoint = mediaItem?.memorial?.id
          ? `/api/memorials/${mediaItem.memorial.id}/media/${id}`
          : `/api/user/library/media/${id}`;

        const response = await fetch(endpoint, { method: "DELETE" });
        if (!response.ok) throw new Error(`Failed to delete ${id}`);
        return id;
      });

      return Promise.all(deletePromises);
    },
    onMutate: (ids) => {
      // Show loading toast with count
      toast.loading(t("dashboard.gallery.deletingBulk", { count: ids.length }), {
        id: "bulk-delete-toast",
      });
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ["user-media"] });
      const successKey =
        deletedIds.length === 1
          ? "dashboard.gallery.bulkDeleteSingle"
          : "dashboard.gallery.bulkDeleteMultiple";
      toast.success(t(successKey, { count: deletedIds.length }), { id: "bulk-delete-toast" });
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("dashboard.gallery.bulkDeleteFailed"), {
        id: "bulk-delete-toast",
      });
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.size > 0) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredMedia.map((m: MediaItem) => m.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // Download media
  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("dashboard.gallery.downloadSuccess"));
    } catch (error) {
      console.error("Download error:", error);
      toast.error(t("dashboard.gallery.downloadFailed"));
    }
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("dashboard.gallery.title")}</h1>
        <p className={`text-lg ${isDark ? "text-white/70" : "text-gray-600"}`}>
          {t("dashboard.gallery.subtitle")}
        </p>
      </div>

      {/* Loading State */}
      {isLoadingMedia && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("dashboard.gallery.loading")}</p>
        </div>
      )}

      {/* Error State */}
      {mediaError && (
        <div className="text-center py-12">
          <X className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className="text-xl mb-2 text-red-600">{t("dashboard.gallery.errorTitle")}</p>
          <p className="text-muted-foreground">{t("dashboard.gallery.errorDesc")}</p>
        </div>
      )}

      {/* Plan Limits Card */}
      {!isLoadingMedia && !mediaError && planData && <PlanLimitsCard planData={planData} />}

      {/* Filter Bar */}
      {!isLoadingMedia && !mediaError && media.length > 0 && (
        <Card className={`mt-6 ${isDark ? "bg-black border-white/10" : "bg-white"}`}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Top Row: Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t("dashboard.gallery.search")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full px-4 py-2 pl-10 rounded-lg border ${
                        isDark
                          ? "bg-black border-white/20 text-white placeholder:text-white/50"
                          : "bg-white border-gray-300 text-black"
                      }`}
                    />
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        {t("dashboard.gallery.sort")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("date")}>
                        {t("dashboard.gallery.sortDate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("name")}>
                        {t("dashboard.gallery.sortName")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("type")}>
                        {t("dashboard.gallery.sortType")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  >
                    {viewMode === "grid" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <Grid3x3 className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Selection Mode */}
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedItems(new Set());
                    }}
                  >
                    {t("dashboard.gallery.select")}
                  </Button>
                </div>
              </div>

              {/* Selection Actions */}
              {isSelectionMode && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {t("dashboard.gallery.selectAll")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    {t("dashboard.gallery.deselectAll")}
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">
                    {selectedItems.size} {t("dashboard.gallery.selected")}
                  </span>
                  {selectedItems.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                      className="ml-auto"
                    >
                      {bulkDeleteMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("dashboard.gallery.deleteSelected")}
                    </Button>
                  )}
                </div>
              )}

              {/* Filter Tabs */}
              <Tabs
                value={filterType}
                onValueChange={(value) => setFilterType(value as "ALL" | "IMAGE" | "VIDEO")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ALL">
                    {t("dashboard.gallery.all")} ({media.length})
                  </TabsTrigger>
                  <TabsTrigger value="IMAGE">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {t("dashboard.gallery.photos")} (
                    {media.filter((m: MediaItem) => m.type === "IMAGE").length})
                  </TabsTrigger>
                  <TabsTrigger value="VIDEO">
                    <VideoIcon className="h-4 w-4 mr-1" />
                    {t("dashboard.gallery.videos")} (
                    {media.filter((m: MediaItem) => m.type === "VIDEO").length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoadingMedia && !mediaError && media.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl mb-2">{t("dashboard.gallery.empty")}</p>
          <p className="text-muted-foreground">
            {t(
              "dashboard.gallery.emptyDesc",
              {},
              "Start uploading photos and videos to your memorial pages"
            )}
          </p>
        </div>
      )}

      {/* Media Grid */}
      {!isLoadingMedia && !mediaError && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-6"
              : "flex flex-col gap-4 mt-6"
          }
        >
          {/* Upload Card */}
          <Card
            className={`group relative overflow-hidden cursor-pointer border-2 border-dashed transition-colors ${
              isDark
                ? "bg-black border-white/20 hover:border-white/40"
                : "bg-white border-gray-300 hover:border-gray-400"
            }`}
          >
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={`relative aspect-square flex flex-col items-center justify-center ${
                  isDragActive ? "bg-primary/10" : ""
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-muted-foreground" />
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-center px-2">
                  {t("dashboard.gallery.uploadTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center px-4 mb-3 sm:mb-4">
                  {isDragActive
                    ? t("dashboard.gallery.dropHere")
                    : t("dashboard.gallery.dragDropLibrary")}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={uploadType === "IMAGE" ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadType("IMAGE");
                    }}
                    className="text-xs sm:text-sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {t("dashboard.gallery.photo")}
                  </Button>
                  <Button
                    variant={uploadType === "VIDEO" ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadType("VIDEO");
                    }}
                    className="text-xs sm:text-sm"
                  >
                    <VideoIcon className="h-4 w-4 mr-1" />
                    {t("dashboard.gallery.video")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploading Files */}
          {uploadingFiles.map((file) => (
            <Card
              key={file.id}
              className={`group relative overflow-hidden ${isDark ? "bg-black border-white/10" : "bg-white border-gray-200"}`}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {/* Upload Status Overlay */}
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                    {file.status === "uploading" && (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-white mb-3" />
                        <p className="text-white text-sm mb-3">
                          {t("dashboard.gallery.uploading")}
                        </p>
                        <div className="w-full max-w-[200px]">
                          <Progress value={file.progress} className="h-2" />
                          <p className="text-white text-xs text-center mt-1">{file.progress}%</p>
                        </div>
                      </>
                    )}
                    {file.status === "success" && (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-white text-sm">{t("dashboard.gallery.uploaded")}</p>
                      </>
                    )}
                    {file.status === "error" && (
                      <>
                        <X className="h-8 w-8 text-red-500 mb-2" />
                        <p className="text-white text-sm">{t("dashboard.gallery.uploadError")}</p>
                        {file.error && <p className="text-white text-xs mt-1">{file.error}</p>}
                      </>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold truncate text-sm">{file.file.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Existing Media */}
          {filteredMedia.map((item: MediaItem) => (
            <Card
              key={item.id}
              className={`group relative overflow-hidden ${
                viewMode === "list" ? "flex flex-row" : ""
              } ${isDark ? "bg-black border-white/10" : "bg-white border-gray-200"} ${
                isSelectionMode && selectedItems.has(item.id) ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className={viewMode === "list" ? "p-0 flex flex-row flex-1" : "p-0"}>
                {/* Media Display */}
                <div
                  className={`relative ${viewMode === "list" ? "w-48 h-32" : "aspect-square"} overflow-hidden bg-muted`}
                >
                  {item.type === "VIDEO" ? (
                    item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title || item.originalName}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <VideoIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )
                  ) : (
                    <Image
                      src={item.thumbnailUrl || item.url}
                      alt={item.title || item.originalName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  )}

                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="w-5 h-5 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Type Badge */}
                  {!isSelectionMode && (
                    <div className="absolute top-2 left-2">
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          isDark ? "bg-black/70 text-white" : "bg-white/90 text-black"
                        }`}
                      >
                        {item.type === "IMAGE" ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <VideoIcon className="h-3 w-3" />
                        )}
                        {item.type === "IMAGE"
                          ? t("dashboard.gallery.photo")
                          : t("dashboard.gallery.video")}
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  {!isSelectionMode && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedMedia(item)}
                        className="mr-2"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("dashboard.gallery.view")}
                      </Button>
                    </div>
                  )}

                  {/* Actions Menu */}
                  {!isSelectionMode && (
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMedia(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t("dashboard.gallery.view")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(item)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t("dashboard.gallery.download")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(item.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("dashboard.gallery.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Media Info */}
                <div
                  className={`p-3 sm:p-4 ${viewMode === "list" ? "flex-1 flex items-center justify-between" : ""}`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold truncate mb-1 text-sm sm:text-base">
                      {item.title || item.originalName}
                    </h3>
                    {item.memorial && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <span className={isDark ? "text-white/60" : "text-gray-500"}>
                          {item.memorial.name}
                        </span>
                      </div>
                    )}
                  </div>
                  {viewMode === "list" && !isSelectionMode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedMedia(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(item)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {!isLoadingMedia && !mediaError && (
        <>
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-6">
            {isFetchingNextPage && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.gallery.loadingMore")}
                </p>
              </div>
            )}
            {!hasNextPage && media.length > 0 && (
              <p className="text-sm text-muted-foreground">{t("dashboard.gallery.allLoaded")}</p>
            )}
          </div>
        </>
      )}

      {/* Lightbox */}
      {selectedMedia && (
        <MediaLightbox
          selectedMedia={{
            id: parseInt(selectedMedia.id) || 0,
            url: selectedMedia.url,
            title: selectedMedia.title || selectedMedia.originalName,
            type: selectedMedia.type.toLowerCase() as "image" | "video",
          }}
          photos={media.map((m: MediaItem, idx: number) => ({
            id: parseInt(m.id) || idx,
            url: m.url,
            title: m.title || m.originalName,
            type: m.type.toLowerCase() as "image" | "video",
          }))}
          onSelect={(m) => {
            if (m) {
              const found = media.find((item: MediaItem) => parseInt(item.id) === m.id);
              setSelectedMedia(found || null);
            } else {
              setSelectedMedia(null);
            }
          }}
          onClose={() => setSelectedMedia(null)}
          theme={theme}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.gallery.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.gallery.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("dashboard.gallery.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("dashboard.gallery.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Gallery;
