"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, Copy, Check, Share2, QrCode, Palette, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

interface MemorialQRCodeProps {
  memorialSlug: string;
  memorialName: string;
  className?: string;
  variant?: "default" | "compact" | "minimal";
  showCustomization?: boolean;
}

interface QROptions {
  size: number;
  margin: number;
  darkColor: string;
  lightColor: string;
}

const DEFAULT_OPTIONS: QROptions = {
  size: 256,
  margin: 2,
  darkColor: "#000000",
  lightColor: "#ffffff",
};

const PRESET_COLORS = [
  { name: "Classic", dark: "#000000", light: "#ffffff" },
  { name: "Navy", dark: "#1e3a5f", light: "#ffffff" },
  { name: "Forest", dark: "#1a4d2e", light: "#ffffff" },
  { name: "Burgundy", dark: "#722f37", light: "#ffffff" },
  { name: "Purple", dark: "#4a1a5c", light: "#ffffff" },
  { name: "Gold Accent", dark: "#1a1a1a", light: "#f5e6d3" },
  { name: "Sepia", dark: "#704214", light: "#f4ead5" },
  { name: "Ocean", dark: "#0077b6", light: "#caf0f8" },
];

export function MemorialQRCode({
  memorialSlug,
  memorialName,
  className,
  variant = "default",
  showCustomization = true,
}: MemorialQRCodeProps) {
  const { t } = useTranslations();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<QROptions>(DEFAULT_OPTIONS);

  const memorialUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memorial/${memorialSlug}`
      : `/memorial/${memorialSlug}`;

  // Generate QR code
  const generateQR = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Use the API endpoint to generate QR code
      const params = new URLSearchParams({
        slug: memorialSlug,
        size: options.size.toString(),
        margin: options.margin.toString(),
        dark: options.darkColor.replace("#", ""),
        light: options.lightColor.replace("#", ""),
      });

      const response = await fetch(`/api/memorial/qr?${params}`);
      if (!response.ok) throw new Error("Failed to generate QR code");

      const blob = await response.blob();
      const dataUrl = URL.createObjectURL(blob);
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      // Fallback: generate client-side using QRCode library
      try {
        const QRCode = (await import("qrcode")).default;
        const fullUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/memorial/${memorialSlug}`
            : `https://foreverpages.com/memorial/${memorialSlug}`;
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: options.size,
          margin: options.margin,
          color: {
            dark: options.darkColor,
            light: options.lightColor,
          },
        });
        setQrDataUrl(dataUrl);
      } catch (fallbackError) {
        console.error("Fallback QR generation failed:", fallbackError);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [memorialSlug, options]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  // Download QR code as PNG
  const downloadPNG = useCallback(() => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `${memorialSlug}-qr-code.png`;
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl, memorialSlug]);

  // Download QR code as SVG
  const downloadSVG = useCallback(async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const fullUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/memorial/${memorialSlug}`
          : `https://foreverpages.com/memorial/${memorialSlug}`;
      const svgString = await QRCode.toString(fullUrl, {
        type: "svg",
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.darkColor,
          light: options.lightColor,
        },
      });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${memorialSlug}-qr-code.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating SVG:", error);
    }
  }, [memorialSlug, options]);

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(memorialUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  }, [memorialUrl]);

  // Share via native share API
  const shareNative = useCallback(async () => {
    if (typeof navigator === "undefined" || !("share" in navigator)) return;

    try {
      await navigator.share({
        title: memorialName,
        text: `View ${memorialName}'s memorial page`,
        url: memorialUrl,
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  }, [memorialName, memorialUrl]);

  // Compact variant for embedding
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {isGenerating ? (
          <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : qrDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrDataUrl}
            alt={`QR code for ${memorialName}`}
            className="w-32 h-32 rounded-lg"
          />
        ) : null}
        <Button variant="outline" size="sm" onClick={downloadPNG}>
          <Download className="h-3 w-3 mr-1" />
          {t("qrCode.download")}
        </Button>
      </div>
    );
  }

  // Minimal variant - just the QR code
  if (variant === "minimal") {
    return (
      <div className={cn("inline-block", className)}>
        {isGenerating ? (
          <div className="w-24 h-24 flex items-center justify-center bg-muted rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : qrDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={qrDataUrl} alt={`QR code for ${memorialName}`} className="w-24 h-24" />
        ) : null}
      </div>
    );
  }

  // Default full variant with card
  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {t("qrCode.title")}
        </CardTitle>
        <CardDescription>{t("qrCode.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center p-4 bg-white rounded-lg border">
          {isGenerating ? (
            <div
              className="flex items-center justify-center bg-muted rounded"
              style={{
                width: Math.min(options.size, 256),
                height: Math.min(options.size, 256),
              }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrDataUrl}
              alt={`QR code for ${memorialName}`}
              style={{ maxWidth: "100%", height: "auto" }}
              className="rounded"
            />
          ) : null}
        </div>

        {/* URL Display */}
        <div className="flex items-center gap-2">
          <Input value={memorialUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {t("qrCode.download")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={downloadPNG}>{t("qrCode.downloadPng")}</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSVG}>{t("qrCode.downloadSvg")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {typeof window !== "undefined" && "share" in navigator && (
            <Button variant="outline" onClick={shareNative}>
              <Share2 className="h-4 w-4 mr-2" />
              {t("qrCode.shareQr")}
            </Button>
          )}

          {showCustomization && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("qrCode.customize.title")}</DialogTitle>
                  <DialogDescription>{t("qrCode.description")}</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="presets" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="presets">
                      <Palette className="h-4 w-4 mr-2" />
                      {t("qrCode.customize.presets")}
                    </TabsTrigger>
                    <TabsTrigger value="custom">
                      <Settings2 className="h-4 w-4 mr-2" />
                      {t("qrCode.customize.custom")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="presets" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            setOptions((prev) => ({
                              ...prev,
                              darkColor: preset.dark,
                              lightColor: preset.light,
                            }))
                          }
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                            options.darkColor === preset.dark && options.lightColor === preset.light
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: preset.light }}
                          >
                            <div
                              className="w-4 h-4 m-2 rounded-sm"
                              style={{ backgroundColor: preset.dark }}
                            />
                          </div>
                          <span className="text-sm">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>{t("qrCode.customize.foreground")}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={options.darkColor}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                darkColor: e.target.value,
                              }))
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={options.darkColor}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                darkColor: e.target.value,
                              }))
                            }
                            className="font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("qrCode.customize.background")}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={options.lightColor}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                lightColor: e.target.value,
                              }))
                            }
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={options.lightColor}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                lightColor: e.target.value,
                              }))
                            }
                            className="font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {t("qrCode.customize.size")}: {options.size}px
                        </Label>
                        <Slider
                          value={[options.size]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, size: value }))
                          }
                          min={128}
                          max={512}
                          step={32}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {t("qrCode.customize.margin")}: {options.margin}
                        </Label>
                        <Slider
                          value={[options.margin]}
                          onValueChange={([value]) =>
                            setOptions((prev) => ({ ...prev, margin: value }))
                          }
                          min={0}
                          max={6}
                          step={1}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Preview */}
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  {isGenerating ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : qrDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrDataUrl}
                      alt={t("qrCode.customize.preview")}
                      className="max-w-[200px]"
                    />
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Usage Tips */}
        <p className="text-xs text-muted-foreground text-center">{t("qrCode.print.description")}</p>
      </CardContent>
    </Card>
  );
}

export default MemorialQRCode;
