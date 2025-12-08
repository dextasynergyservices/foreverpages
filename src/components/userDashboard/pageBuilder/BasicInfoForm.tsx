import React, { useState, useEffect } from "react";
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
import { useTranslations } from "@/hooks/useTranslations";
import { useAutoSave, DraftData } from "@/hooks/useAutoSave";
import { SaveStatusIndicator } from "./SaveStatusIndicator";

interface BasicInfoData {
  fullName: string;
  birthDate: string;
  passingDate: string;
  relationship: string;
  shortBio: string;
}

interface BasicInfoFormProps {
  memorialId?: string;
  onDataChange?: (data: BasicInfoData) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ memorialId, onDataChange }) => {
  const { t } = useTranslations();
  const [formData, setFormData] = useState<BasicInfoData>({
    fullName: "",
    birthDate: "",
    passingDate: "",
    relationship: "",
    shortBio: "",
  });

  const { autoSave, autoSaveError, saveStatus, lastSavedAt } = useAutoSave({
    memorialId,
    enabled: !!memorialId,
    debounceMs: 1000,
    onSuccess: (data) => {
      // Optional: sync back to local state if needed
      console.log("Draft saved successfully:", data);
    },
    onError: (error) => {
      console.error("Draft save error:", error);
    },
  });

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

  const handleInputChange = (field: keyof BasicInfoData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Save to localStorage as fallback
    localStorage.setItem("memorialBasicInfo", JSON.stringify(newData));

    // Trigger auto-save if memorial ID is available
    if (memorialId) {
      autoSave(newData as DraftData);
    }

    // Call parent callback if provided
    onDataChange?.(newData);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <SaveStatusIndicator
        status={saveStatus}
        lastSavedAt={lastSavedAt}
        error={autoSaveError}
        showTimestamp
      />
      <div>
        <Label htmlFor="full-name">
          {t("dashboard.pageBuilder.basicInfo.fullName.label", {}, "Full Name *")}
        </Label>
        <Input
          id="full-name"
          placeholder={t(
            "dashboard.pageBuilder.basicInfo.fullName.placeholder",
            {},
            "Enter the full name"
          )}
          value={formData.fullName}
          onChange={(e) => handleInputChange("fullName", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birth-date">
            {t("dashboard.pageBuilder.basicInfo.birthDate.label", {}, "Birth Date")}
          </Label>
          <Input
            id="birth-date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange("birthDate", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="passing-date">
            {t("dashboard.pageBuilder.basicInfo.passingDate.label", {}, "Date of Passing")}
          </Label>
          <Input
            id="passing-date"
            type="date"
            value={formData.passingDate}
            onChange={(e) => handleInputChange("passingDate", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="relationship">
          {t("dashboard.pageBuilder.basicInfo.relationship.label", {}, "Your Relationship")}
        </Label>
        <Select
          value={formData.relationship}
          onValueChange={(value) => handleInputChange("relationship", value)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={t(
                "dashboard.pageBuilder.basicInfo.relationship.placeholder",
                {},
                "Select your relationship"
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">
              {t("dashboard.pageBuilder.basicInfo.relationship.options.spouse", {}, "Spouse")}
            </SelectItem>
            <SelectItem value="child">
              {t("dashboard.pageBuilder.basicInfo.relationship.options.child", {}, "Child")}
            </SelectItem>
            <SelectItem value="parent">
              {t("dashboard.pageBuilder.basicInfo.relationship.options.parent", {}, "Parent")}
            </SelectItem>
            <SelectItem value="sibling">
              {t("dashboard.pageBuilder.basicInfo.relationship.options.sibling", {}, "Sibling")}
            </SelectItem>
            <SelectItem value="family">
              {t("dashboard.pageBuilder.basicInfo.relationship.options.family", {}, "Other Family")}
            </SelectItem>
            <SelectItem value="friend">
              {t("dashboard.pageBuilder.basicInfo.relationship.options.friend", {}, "Friend")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="short-bio">
          {t("dashboard.pageBuilder.basicInfo.shortBio.label", {}, "Brief Biography")}
        </Label>
        <Textarea
          id="short-bio"
          placeholder={t(
            "dashboard.pageBuilder.basicInfo.shortBio.placeholder",
            {},
            "Share a few words about their life, personality, and what made them special..."
          )}
          rows={4}
          value={formData.shortBio}
          onChange={(e) => handleInputChange("shortBio", e.target.value)}
        />
      </div>
    </div>
  );
};
