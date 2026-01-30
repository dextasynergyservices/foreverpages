"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { useTheme } from "@/hooks/useTheme";
import Image from "next/image";

export interface HeroData {
  firstName?: string;
  lastName?: string;
  mainImage?: string;
  title?: string;
  subtitle?: string;
  birthDate?: string;
  deathDate?: string;
  quote?: string;
}

interface HeroEditorProps {
  data: HeroData;
  onChange: (data: HeroData) => void;
  onOpenMediaPicker?: () => void;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
  };
  onMemorialDataChange?: (data: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
  }) => void;
}

export const HeroEditor: React.FC<HeroEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
  memorialData,
  onMemorialDataChange,
}) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const handleChange = (field: keyof HeroData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleNameChange = (field: "firstName" | "lastName", value: string) => {
    // Update both hero data and memorial data
    onChange({ ...data, [field]: value });
    if (onMemorialDataChange) {
      onMemorialDataChange({ ...memorialData, [field]: value });
    }
  };

  const handleDateChange = (field: "birthDate" | "deathDate", value: string) => {
    // Update both hero data and memorial data
    onChange({ ...data, [field]: value });
    if (onMemorialDataChange) {
      onMemorialDataChange({ ...memorialData, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Hero Section</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          The main header section that visitors see first
        </p>
      </div>

      {/* First Name & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
        <div>
          <Label htmlFor="hero-firstName" className="flex items-center gap-1">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hero-firstName"
            placeholder="John"
            value={data.firstName || memorialData?.firstName || ""}
            onChange={(e) => handleNameChange("firstName", e.target.value)}
            required
          />
          <p className={`text-xs mt-1 ${textMuted}`}>The deceased person&apos;s first name</p>
        </div>
        <div>
          <Label htmlFor="hero-lastName" className="flex items-center gap-1">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hero-lastName"
            placeholder="Doe"
            value={data.lastName || memorialData?.lastName || ""}
            onChange={(e) => handleNameChange("lastName", e.target.value)}
            required
          />
          <p className={`text-xs mt-1 ${textMuted}`}>The deceased person&apos;s last name</p>
        </div>
      </div>

      {/* Main Image */}
      <div>
        <Label>Main Hero Image</Label>
        {data.mainImage ? (
          <div className="relative mt-2">
            <Image
              src={data.mainImage}
              alt="Hero"
              className="w-full h-64 object-cover rounded-lg"
              fill
            />
            <button
              onClick={() => handleChange("mainImage", "")}
              className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded-md text-sm"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenMediaPicker}
            className={`w-full mt-2 h-64 border-2 border-dashed rounded-lg flex items-center justify-center ${
              theme === "dark"
                ? "border-white/10 hover:border-white/20"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="text-center">
              <p className={textMuted}>Click to select hero image</p>
            </div>
          </button>
        )}
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="hero-title">Title (Usually Full Name)</Label>
        <Input
          id="hero-title"
          placeholder="John Doe"
          value={data.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
        />
      </div>

      {/* Subtitle */}
      <div>
        <Label htmlFor="hero-subtitle">Subtitle (Optional)</Label>
        <Input
          id="hero-subtitle"
          placeholder="Loving Father, Devoted Friend"
          value={data.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hero-birth">Birth Date</Label>
          <Input
            id="hero-birth"
            type="date"
            value={data.birthDate || memorialData?.birthDate || ""}
            onChange={(e) => handleDateChange("birthDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="hero-death">Death Date</Label>
          <Input
            id="hero-death"
            type="date"
            value={data.deathDate || memorialData?.deathDate || ""}
            onChange={(e) => handleDateChange("deathDate", e.target.value)}
          />
        </div>
      </div>

      {/* Quote */}
      <div>
        <Label htmlFor="hero-quote">Memorial Quote (Optional)</Label>
        <Textarea
          id="hero-quote"
          placeholder="A meaningful quote or saying..."
          rows={2}
          value={data.quote || ""}
          onChange={(e) => handleChange("quote", e.target.value)}
        />
        <p className={`text-xs mt-1 ${textMuted}`}>
          A quote that captures their spirit or philosophy
        </p>
      </div>
    </div>
  );
};
