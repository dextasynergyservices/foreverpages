"use client";

import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export interface HeaderData {
  logo?: string;
  siteName?: string;
  tagline?: string;
  showNavigation?: boolean;
  navigationItems?: Array<{
    id: string;
    label: string;
    href: string;
    isVisible: boolean;
  }>;
  backgroundColor?: string;
  textColor?: string;
  showSocialLinks?: boolean;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface HeaderEditorProps {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

const defaultNavigationItems = [
  { id: "1", label: "Home", href: "#home", isVisible: true },
  { id: "2", label: "Life Story", href: "#biography", isVisible: true },
  { id: "3", label: "Gallery", href: "#gallery", isVisible: true },
  { id: "4", label: "Tributes", href: "#tributes", isVisible: true },
  { id: "5", label: "Condolences", href: "#condolences", isVisible: true },
];

export const HeaderEditor: React.FC<HeaderEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const borderClass = theme === "dark" ? "border-white/10" : "border-gray-200";
  const bgClass = theme === "dark" ? "bg-gray-800" : "bg-gray-50";
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleChange = (field: keyof HeaderData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  // Direct logo file upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB for logos)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo image must be less than 2MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload logo");
      }

      if (result.data?.url) {
        handleChange("logo", result.data.url);
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      console.error("Logo upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload logo. Please try again."
      );
    } finally {
      setIsUploadingLogo(false);
      // Reset input so the same file can be selected again
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleNavItemChange = (
    index: number,
    field: keyof (typeof defaultNavigationItems)[0],
    value: string | boolean
  ) => {
    const items = [...(data.navigationItems || defaultNavigationItems)];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...data, navigationItems: items });
  };

  const addNavigationItem = () => {
    const items = [...(data.navigationItems || defaultNavigationItems)];
    items.push({
      id: Date.now().toString(),
      label: "New Link",
      href: "#section",
      isVisible: true,
    });
    onChange({ ...data, navigationItems: items });
  };

  const removeNavigationItem = (index: number) => {
    const items = [...(data.navigationItems || defaultNavigationItems)];
    items.splice(index, 1);
    onChange({ ...data, navigationItems: items });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Header & Navigation</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Customize the site header, logo, and navigation menu
        </p>
      </div>

      {/* Logo */}
      <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
        <Label className="font-semibold">Logo</Label>
        <p className={`text-xs mb-3 ${textMuted}`}>
          Upload a custom logo for the memorial site (max 2MB)
        </p>

        {/* Hidden file input */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {data.logo ? (
          <div className="relative mt-2">
            <div className="relative w-48 h-16 rounded-lg overflow-hidden border">
              <Image src={data.logo} alt="Logo" fill className="object-contain" />
            </div>
            <button
              onClick={() => handleChange("logo", "")}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              Remove Logo
            </button>
          </div>
        ) : (
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploadingLogo}
            className={`w-full mt-2 h-24 border-2 border-dashed rounded-lg flex items-center justify-center ${
              theme === "dark"
                ? "border-white/10 hover:border-white/20"
                : "border-gray-300 hover:border-gray-400"
            } ${isUploadingLogo ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="text-center">
              {isUploadingLogo ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className={textMuted}>Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className={textMuted}>Click to upload logo</p>
                </div>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Site Name & Tagline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="header-siteName">Site Name</Label>
          <Input
            id="header-siteName"
            placeholder="In Loving Memory"
            value={data.siteName || ""}
            onChange={(e) => handleChange("siteName", e.target.value)}
          />
          <p className={`text-xs mt-1 ${textMuted}`}>Displayed in the header</p>
        </div>
        <div>
          <Label htmlFor="header-tagline">Tagline (Optional)</Label>
          <Input
            id="header-tagline"
            placeholder="Celebrating a Beautiful Life"
            value={data.tagline || ""}
            onChange={(e) => handleChange("tagline", e.target.value)}
          />
        </div>
      </div>

      {/* Navigation Toggle */}
      <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="font-semibold">Show Navigation Menu</Label>
            <p className={`text-xs ${textMuted}`}>Enable or disable the navigation bar</p>
          </div>
          <Switch
            checked={data.showNavigation !== false}
            onCheckedChange={(checked) => handleChange("showNavigation", checked)}
          />
        </div>

        {/* Navigation Items */}
        {data.showNavigation !== false && (
          <div className="space-y-3">
            <Label className="text-sm">Navigation Links</Label>
            {(data.navigationItems || defaultNavigationItems).map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded border ${borderClass}`}
              >
                <Switch
                  checked={item.isVisible}
                  onCheckedChange={(checked) => handleNavItemChange(index, "isVisible", checked)}
                />
                <Input
                  value={item.label}
                  onChange={(e) => handleNavItemChange(index, "label", e.target.value)}
                  placeholder="Label"
                  className="flex-1"
                />
                <Input
                  value={item.href}
                  onChange={(e) => handleNavItemChange(index, "href", e.target.value)}
                  placeholder="#section"
                  className="w-32"
                />
                <button
                  onClick={() => removeNavigationItem(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addNavigationItem}
              className={`w-full py-2 border-2 border-dashed rounded-lg text-sm ${
                theme === "dark"
                  ? "border-white/10 hover:border-white/20 text-white/70"
                  : "border-gray-300 hover:border-gray-400 text-gray-600"
              }`}
            >
              + Add Navigation Link
            </button>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="header-bgColor">Background Color</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              id="header-bgColor"
              value={data.backgroundColor || "#1f2937"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <Input
              value={data.backgroundColor || "#1f2937"}
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              placeholder="#1f2937"
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="header-textColor">Text Color</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              id="header-textColor"
              value={data.textColor || "#ffffff"}
              onChange={(e) => handleChange("textColor", e.target.value)}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <Input
              value={data.textColor || "#ffffff"}
              onChange={(e) => handleChange("textColor", e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="font-semibold">Show Social Links</Label>
            <p className={`text-xs ${textMuted}`}>Display social media links in the header</p>
          </div>
          <Switch
            checked={data.showSocialLinks || false}
            onCheckedChange={(checked) => handleChange("showSocialLinks", checked)}
          />
        </div>

        {data.showSocialLinks && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="social-facebook">Facebook</Label>
              <Input
                id="social-facebook"
                placeholder="https://facebook.com/..."
                value={data.socialLinks?.facebook || ""}
                onChange={(e) =>
                  handleChange("socialLinks", {
                    ...data.socialLinks,
                    facebook: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="social-twitter">Twitter / X</Label>
              <Input
                id="social-twitter"
                placeholder="https://twitter.com/..."
                value={data.socialLinks?.twitter || ""}
                onChange={(e) =>
                  handleChange("socialLinks", {
                    ...data.socialLinks,
                    twitter: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="social-instagram">Instagram</Label>
              <Input
                id="social-instagram"
                placeholder="https://instagram.com/..."
                value={data.socialLinks?.instagram || ""}
                onChange={(e) =>
                  handleChange("socialLinks", {
                    ...data.socialLinks,
                    instagram: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="social-linkedin">LinkedIn</Label>
              <Input
                id="social-linkedin"
                placeholder="https://linkedin.com/..."
                value={data.socialLinks?.linkedin || ""}
                onChange={(e) =>
                  handleChange("socialLinks", {
                    ...data.socialLinks,
                    linkedin: e.target.value,
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
