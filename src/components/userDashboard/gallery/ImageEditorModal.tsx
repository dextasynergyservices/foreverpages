"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCw, RotateCcw, Crop, Image as ImageIcon, Loader2 } from "lucide-react";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";
import Image from "next/image";

interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageBlob: Blob, editedImageUrl: string) => Promise<void>;
}

interface FilterState {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  grayscale: number;
}

export function ImageEditorModal({ open, onClose, imageUrl, onSave }: ImageEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"crop" | "filters">("crop");
  const [saving, setSaving] = useState(false);

  // Crop state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    grayscale: 0,
  });

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    filters: FilterState
  ): Promise<{ blob: Blob; url: string }> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2D context");
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // Apply filters
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%)`;
    ctx.drawImage(canvas, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }, "image/jpeg");
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setSaving(true);
    try {
      const { blob, url } = await getCroppedImg(imageUrl, croppedAreaPixels, rotation, filters);
      await onSave(blob, url);
      onClose();
    } catch (error) {
      console.error("Error saving edited image:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFilters({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      sepia: 0,
      grayscale: 0,
    });
  };

  const filterStyle = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%)`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "crop" | "filters")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crop" className="flex items-center gap-2">
              <Crop className="h-4 w-4" />
              Crop & Rotate
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Filters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="space-y-4 mt-4">
            <div className="relative h-[500px] bg-black rounded-lg overflow-hidden">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    filter: filterStyle,
                  },
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Zoom</label>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={([v]) => setZoom(v)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rotation</label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setRotation((r) => r - 90)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[rotation]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={([v]) => setRotation(v)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => setRotation((r) => r + 90)}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12">{rotation}°</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4 mt-4">
            {/* Preview */}
            <div className="relative h-[300px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src={imageUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                style={{ filter: filterStyle }}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    filter: filterStyle,
                  },
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brightness</label>
                <Slider
                  value={[filters.brightness]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([v]) => setFilters({ ...filters, brightness: v })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contrast</label>
                <Slider
                  value={[filters.contrast]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([v]) => setFilters({ ...filters, contrast: v })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Saturation</label>
                <Slider
                  value={[filters.saturate]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([v]) => setFilters({ ...filters, saturate: v })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sepia</label>
                <Slider
                  value={[filters.sepia]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setFilters({ ...filters, sepia: v })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grayscale</label>
                <Slider
                  value={[filters.grayscale]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setFilters({ ...filters, grayscale: v })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
