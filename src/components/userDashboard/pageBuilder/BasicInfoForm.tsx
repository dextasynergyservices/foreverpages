import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import toast from "react-hot-toast";

interface BasicInfoData {
  fullName: string;
  birthDate: string;
  passingDate: string;
  relationship: string;
  shortBio: string;
}

export const BasicInfoForm: React.FC = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<BasicInfoData>({
    fullName: "",
    birthDate: "",
    passingDate: "",
    relationship: "",
    shortBio: "",
  });
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("memorialBasicInfo");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error("Error parsing saved basic info data:", error);
      }
    }
  }, []);

  // Debounced auto-save function
  const autoSave = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return (data: BasicInfoData) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        localStorage.setItem("memorialBasicInfo", JSON.stringify(data));
        setTimeout(() => {
          setIsAutoSaving(false);
          toast.success("Auto-saved", { duration: 1000 });
        }, 500);
      }, 1000); // 1 second debounce
    };
  }, []);

  const debouncedSave = autoSave();

  const handleInputChange = (field: keyof BasicInfoData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    debouncedSave(newData);
  };

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {isAutoSaving && <div className={`text-sm ${textMuted} text-center`}>Saving...</div>}
      <div>
        <Label htmlFor="full-name">Full Name *</Label>
        <Input
          id="full-name"
          placeholder="Enter the full name"
          value={formData.fullName}
          onChange={(e) => handleInputChange("fullName", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birth-date">Birth Date</Label>
          <Input
            id="birth-date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange("birthDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="passing-date">Date of Passing</Label>
          <Input
            id="passing-date"
            type="date"
            value={formData.passingDate}
            onChange={(e) => handleInputChange("passingDate", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="relationship">Your Relationship</Label>
        <Select
          value={formData.relationship}
          onValueChange={(value) => handleInputChange("relationship", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="family">Other Family</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="short-bio">Brief Biography</Label>
        <Textarea
          id="short-bio"
          placeholder="Share a few words about their life, personality, and what made them special..."
          rows={4}
          value={formData.shortBio}
          onChange={(e) => handleInputChange("shortBio", e.target.value)}
        />
      </div>
    </div>
  );
};
