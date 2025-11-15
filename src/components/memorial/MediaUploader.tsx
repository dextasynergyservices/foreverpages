"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface UploadedData {
  id: string;
  url: string;
  thumbnailUrl?: string;
  publicId: string;
  [key: string]: unknown;
}

interface LimitData {
  current: number;
  max: number;
}

interface UploadResponse {
  data: UploadedData;
  limits?: {
    images?: LimitData;
    videos?: LimitData;
  };
}

interface MediaUploaderProps {
  memorialId: string;
  type: "IMAGE" | "VIDEO";
  album?: string;
  onUploadComplete?: (uploads: UploadedData[]) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  uploadedData?: UploadedData;
}

export function MediaUploader({
  memorialId,
  type,
  album,
  onUploadComplete,
  maxFiles = 10,
  className,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [limits, setLimits] = useState<{
    current: number;
    max: number;
  } | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setLimitError(null);

      // Limit number of files
      const filesToAdd = acceptedFiles.slice(0, maxFiles - files.length);

      const newFiles: UploadFile[] = filesToAdd.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending",
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      type === "IMAGE"
        ? { "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }
        : { "video/*": [".mp4", ".mov", ".avi", ".wmv"] },
    maxSize: type === "IMAGE" ? 10 * 1024 * 1024 : 100 * 1024 * 1024, // 10MB for images, 100MB for videos
    multiple: true,
    disabled: isUploading,
  });

  // Remove file from list
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Upload single file
  const uploadFile = async (uploadFile: UploadFile): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", uploadFile.file);
    formData.append("type", type);
    if (album) formData.append("album", album);

    const response = await fetch(`/api/memorials/${memorialId}/media`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  };

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setLimitError(null);

    const uploadPromises = files
      .filter((f) => f.status === "pending")
      .map(async (fileToUpload) => {
        try {
          // Update status to uploading
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileToUpload.id ? { ...f, status: "uploading" as const, progress: 50 } : f
            )
          );

          // Upload file
          const result = await uploadFile(fileToUpload);

          // Update status to success
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileToUpload.id
                ? {
                    ...f,
                    status: "success" as const,
                    progress: 100,
                    uploadedData: result.data,
                  }
                : f
            )
          );

          // Update limits
          if (result.limits) {
            const key = type === "IMAGE" ? "images" : "videos";
            const limitData = result.limits[key];
            if (limitData) {
              setLimits(limitData);
            }
          }

          return result.data;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Upload failed";
          // Update status to error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileToUpload.id
                ? {
                    ...f,
                    status: "error" as const,
                    error: errorMessage,
                  }
                : f
            )
          );

          // Check for limit errors
          if (errorMessage.includes("limit")) {
            setLimitError(errorMessage);
          }

          return null;
        }
      });

    const results = await Promise.all(uploadPromises);
    const successfulUploads: UploadedData[] = results.filter((r): r is UploadedData => r !== null);

    setIsUploading(false);

    if (successfulUploads.length > 0 && onUploadComplete) {
      onUploadComplete(successfulUploads);
    }
  };

  // Clear completed uploads
  const clearCompleted = () => {
    setFiles((prev) => {
      prev.forEach((f) => {
        if (f.status === "success" && f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });
      return prev.filter((f) => f.status !== "success");
    });
  };

  const pendingFiles = files.filter((f) => f.status === "pending").length;
  const uploadingFiles = files.filter((f) => f.status === "uploading").length;
  const successFiles = files.filter((f) => f.status === "success").length;
  const errorFiles = files.filter((f) => f.status === "error").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Limit Display */}
      {limits && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">
            {type === "IMAGE" ? "Photos" : "Videos"} used:
          </span>
          <span className="font-medium">
            {limits.current} / {limits.max}
          </span>
        </div>
      )}

      {/* Limit Error */}
      {limitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{limitError}</AlertDescription>
        </Alert>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          {type === "IMAGE" ? (
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Video className="h-12 w-12 text-muted-foreground" />
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop files here"
                : `Drag & drop ${type === "IMAGE" ? "images" : "videos"} here`}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse (max {type === "IMAGE" ? "10MB" : "100MB"} per file)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Files ({files.length}){successFiles > 0 && ` - ${successFiles} uploaded`}
              {errorFiles > 0 && ` - ${errorFiles} failed`}
            </h4>
            {successFiles > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompleted} disabled={isUploading}>
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                {/* Preview */}
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {type === "IMAGE" ? (
                    <Image
                      src={file.preview}
                      alt={file.file.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <Video className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progress */}
                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}

                  {/* Error Message */}
                  {file.status === "error" && file.error && (
                    <p className="mt-1 text-xs text-destructive">{file.error}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {file.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {file.status === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {file.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {file.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {pendingFiles > 0 && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || pendingFiles === 0}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading {uploadingFiles} of {pendingFiles}...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {pendingFiles} {type === "IMAGE" ? "Image" : "Video"}
                  {pendingFiles > 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
