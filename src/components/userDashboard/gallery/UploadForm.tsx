import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";

interface UploadFormProps {
  t: (key: string, params?: unknown, fallback?: string) => string;
  formId?: string;
}

export const UploadForm: React.FC<UploadFormProps> = ({ t, formId = "" }) => {
  const { theme } = useTheme();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`media-upload${formId}`} className="text-sm font-medium">
          {t("dashboard.gallery.labels.selectFiles")}
        </Label>
        <Input
          id={`media-upload${formId}`}
          type="file"
          multiple
          accept="image/*,video/*"
          className="cursor-pointer"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`media-title${formId}`} className="text-sm font-medium">
          {t("dashboard.gallery.labels.titleOptional")}
        </Label>
        <Input id={`media-title${formId}`} placeholder="Enter a title for this media" />
      </div>
      <Button
        variant="memorial"
        className={`w-full mt-4 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
      >
        {t("dashboard.gallery.actions.upload")}
      </Button>
    </div>
  );
};
