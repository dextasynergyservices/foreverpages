"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountryCodes } from "@/hooks/useCountryCodes";
import { Loader2 } from "lucide-react";

interface CountryCodeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  variant?: "default" | "peace-template";
}

export function CountryCodeSelect({
  value,
  onValueChange,
  className,
  placeholder = "Code",
  disabled = false,
  variant = "default",
}: CountryCodeSelectProps) {
  const { data: countryCodes, isLoading, error } = useCountryCodes();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn("w-32", className)}>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className={cn("w-32", className)}>
          <SelectValue placeholder="Error" />
        </SelectTrigger>
      </Select>
    );
  }

  const selectTriggerClass =
    variant === "peace-template"
      ? cn(
          "w-32 rounded-lg border border-cream/20 bg-cream/10 text-cream focus:border-soft-gold focus:ring-soft-gold/20",
          className
        )
      : cn("w-32", className);

  const selectContentClass =
    variant === "peace-template"
      ? "max-h-60 overflow-y-auto bg-dark-forest border-cream/20"
      : "max-h-60 overflow-y-auto";

  const selectItemClass = variant === "peace-template" ? "text-cream hover:bg-cream/10" : "";

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={selectTriggerClass}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={selectContentClass}>
        {countryCodes?.map((country, index) => (
          <SelectItem
            key={`${country.code}-${index}`}
            value={country.code}
            className={selectItemClass}
          >
            {country.flag} {country.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
