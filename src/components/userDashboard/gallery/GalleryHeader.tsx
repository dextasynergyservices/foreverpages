import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { UploadForm } from "./UploadForm";

interface GalleryHeaderProps {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  /** When true the component will render only the DialogTrigger so a parent Dialog.Root can control the dialog */
  externalDialog?: boolean;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  theme,
  t,
  externalDialog = false,
}) => {
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold">
          {t("dashboard.gallery.title")}
        </h1>
        <p className={`mt-2 ${textMuted}`}>{t("dashboard.gallery.subtitle")}</p>
      </div>

      {/* Main Upload Button */}
      {externalDialog ? (
        <DialogTrigger asChild>
          <Button variant="memorial" className="gap-2 relative z-10">
            <Upload className="h-4 w-4 " />
            {t("dashboard.gallery.uploadMedia")}
          </Button>
        </DialogTrigger>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="memorial" className="gap-2 relative z-10">
              <Upload className="h-4 w-4" />
              {t("dashboard.gallery.uploadMedia")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className={`max-w-md ${theme === "dark" ? "bg-black text-white border-white/10" : ""} z-50`}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {t("dashboard.gallery.uploadDialogTitle")}
              </DialogTitle>
            </DialogHeader>
            <UploadForm t={t} formId="" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
