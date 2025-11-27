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
import { useTranslations } from "@/hooks/useTranslations";
import toast from "react-hot-toast";

interface MemorialDetailsData {
  profilePhoto: File | null;
  backgroundImage: File | null;
  memorialMessage: string;
  privacySetting: string;
}

export const MemorialDetailsForm: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [formData, setFormData] = useState<MemorialDetailsData>({
    profilePhoto: null,
    backgroundImage: null,
    memorialMessage: "",
    privacySetting: "public",
  });
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("memorialDetails");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Note: File objects can't be stored in localStorage, so we only restore text data
        setFormData((prev) => ({
          ...prev,
          memorialMessage: parsedData.memorialMessage || "",
          privacySetting: parsedData.privacySetting || "public",
        }));
      } catch (error) {
        console.error("Error parsing saved memorial details data:", error);
      }
    }
  }, []);

  // Debounced auto-save function
  const autoSave = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return (data: Partial<MemorialDetailsData>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        // Only save text data to localStorage (files can't be stored)
        const dataToSave = {
          memorialMessage: data.memorialMessage,
          privacySetting: data.privacySetting,
        };
        localStorage.setItem("memorialDetails", JSON.stringify(dataToSave));
        setTimeout(() => {
          setIsAutoSaving(false);
          toast.success(t("dashboard.pageBuilder.memorialDetails.autoSaved", {}, "Auto-saved"), {
            duration: 1000,
          });
        }, 500);
      }, 1000); // 1 second debounce
    };
  }, [t]);

  const debouncedSave = autoSave();

  const handleInputChange = (field: keyof MemorialDetailsData, value: string | File | null) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Only auto-save text data
    if (field === "memorialMessage" || field === "privacySetting") {
      debouncedSave({ [field]: value });
    }
  };

  const handleFileChange = (field: "profilePhoto" | "backgroundImage", file: File | null) => {
    const newData = { ...formData, [field]: file };
    setFormData(newData);
    // Files are not auto-saved to localStorage
  };

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {isAutoSaving && (
        <div className={`text-sm ${textMuted} text-center`}>
          {t("dashboard.pageBuilder.memorialDetails.saving", {}, "Saving...")}
        </div>
      )}
      <div>
        <Label htmlFor="profile-photo">
          {t("dashboard.pageBuilder.memorialDetails.profilePhoto.label", {}, "Profile Photo")}
        </Label>
        <Input
          id="profile-photo"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange("profilePhoto", e.target.files?.[0] || null)}
        />
        <p className={`text-sm mt-1 ${textMuted}`}>
          {t(
            "dashboard.pageBuilder.memorialDetails.profilePhoto.helpText",
            {},
            "Upload a beautiful photo that represents them"
          )}
        </p>
      </div>
      <div>
        <Label htmlFor="background-image">
          {t(
            "dashboard.pageBuilder.memorialDetails.backgroundImage.label",
            {},
            "Background Image (Optional)"
          )}
        </Label>
        <Input
          id="background-image"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange("backgroundImage", e.target.files?.[0] || null)}
        />
        <p className={`text-sm mt-1 ${textMuted}`}>
          {t(
            "dashboard.pageBuilder.memorialDetails.backgroundImage.helpText",
            {},
            "A meaningful place or memory"
          )}
        </p>
      </div>
      <div>
        <Label htmlFor="memorial-message">
          {t("dashboard.pageBuilder.memorialDetails.memorialMessage.label", {}, "Memorial Message")}
        </Label>
        <Textarea
          id="memorial-message"
          placeholder={t(
            "dashboard.pageBuilder.memorialDetails.memorialMessage.placeholder",
            {},
            "A special message or quote that captures their spirit..."
          )}
          rows={3}
          value={formData.memorialMessage}
          onChange={(e) => handleInputChange("memorialMessage", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="privacy-setting">
          {t("dashboard.pageBuilder.memorialDetails.privacySetting.label", {}, "Privacy Setting")}
        </Label>
        <Select
          value={formData.privacySetting}
          onValueChange={(value) => handleInputChange("privacySetting", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">
              {t(
                "dashboard.pageBuilder.memorialDetails.privacySetting.options.public",
                {},
                "Public - Anyone can view"
              )}
            </SelectItem>
            <SelectItem value="unlisted">
              {t(
                "dashboard.pageBuilder.memorialDetails.privacySetting.options.unlisted",
                {},
                "Unlisted - Only with link"
              )}
            </SelectItem>
            <SelectItem value="private">
              {t(
                "dashboard.pageBuilder.memorialDetails.privacySetting.options.private",
                {},
                "Private - Invited only"
              )}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
