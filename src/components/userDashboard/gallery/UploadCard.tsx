import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { UploadForm } from "./UploadForm";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface UploadCardProps {
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
  /** When true, the UploadCard will render only the DialogTrigger (no DialogContent). Parent may provide Dialog.Root/Content */
  externalDialog?: boolean;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  themeClasses,
  t,
  externalDialog = false,
}) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;

  const card = (
    <Card
      className={`
            border-dashed border-2
            hover:border-current
            transition-all
            duration-200
            cursor-pointer
            hover:shadow-lg
            hover:scale-105
            ${cardBg}
            ${cardBorder}
            relative
            z-20
          `}
    >
      <CardContent className="aspect-square flex flex-col items-center justify-center p-6">
        <Upload className="h-12 w-12 mb-4 opacity-60" />
        <p className={`text-sm text-center font-medium ${textMuted}`}>
          {t("dashboard.gallery.actions.addMore")}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative z-10">
      {externalDialog ? (
        <DialogTrigger asChild>{card}</DialogTrigger>
      ) : (
        <Dialog>
          <DialogTrigger asChild>{card}</DialogTrigger>

          <DialogContent
            className={`
            max-w-md
            ${themeClasses.cardBg === "bg-black" ? "bg-black text-white border-white/10" : "bg-white text-black border-gray-200"}
            z-[100]
            shadow-2xl
          `}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-center">
                {t("dashboard.gallery.uploadDialogTitle")}
              </DialogTitle>
            </DialogHeader>
            <UploadForm t={t} formId="-card" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
