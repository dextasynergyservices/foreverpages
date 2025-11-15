"use client";

import { useState } from "react";
import { StreamQuality } from "@/generated/prisma";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QualitySelectorProps {
  currentQuality: StreamQuality;
  onQualityChange: (quality: StreamQuality) => void;
}

const qualityOptions: { value: StreamQuality; label: string; description: string }[] = [
  { value: "LOWEST", label: "144p", description: "Lowest (saves data)" },
  { value: "LOW", label: "240p", description: "Low" },
  { value: "MEDIUM", label: "360p", description: "Medium" },
  { value: "SD", label: "480p", description: "SD" },
  { value: "HD", label: "720p", description: "HD" },
  { value: "FULL_HD", label: "1080p", description: "Full HD" },
];

export default function QualitySelector({ currentQuality, onQualityChange }: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = qualityOptions.find((opt) => opt.value === currentQuality)?.label || "Auto";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white border-white/20"
        >
          <Settings className="h-4 w-4 mr-2" />
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-black/90 backdrop-blur-sm border-white/20"
      >
        <DropdownMenuLabel className="text-white">Stream Quality</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuRadioGroup
          value={currentQuality}
          onValueChange={(value) => onQualityChange(value as StreamQuality)}
        >
          {qualityOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-400">{option.description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
