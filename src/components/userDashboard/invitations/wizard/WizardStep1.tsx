"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MdClose, MdImage, MdInfo } from "react-icons/md";
import { useMemorials } from "@/hooks/useMemorials";
import { format } from "date-fns";
import { invitationErrors } from "@/lib/invitationToasts";
import { MemorialSelectSkeleton } from "../SkeletonLoaders";

interface WizardStep1Props {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  initialData?: Partial<{
    memorialId: string;
    customSubject: string;
    message: string;
    invitationCard: File | null;
  }>;
}

export interface WizardStep1Handle {
  getData: () => {
    memorialId: string;
    customSubject: string;
    message: string;
    invitationCard: File | null;
  };
  reset?: () => void;
}

export const WizardStep1 = forwardRef<WizardStep1Handle, WizardStep1Props>(
  ({ theme, t, initialData }, ref) => {
    const [invitationCard, setInvitationCard] = useState<File | null>(
      initialData?.invitationCard || null
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedMemorial, setSelectedMemorial] = useState<string>(initialData?.memorialId || "");
    const [customSubject, setCustomSubject] = useState<string>(initialData?.customSubject || "");
    const [message, setMessage] = useState<string>(initialData?.message || "");

    const { data: memorialsData, isLoading: loadingMemorials } = useMemorials();

    // Get selected memorial details
    const selectedMemorialDetails = memorialsData?.data.memorials.find(
      (m) => m.id === selectedMemorial
    );

    useImperativeHandle(ref, () => ({
      getData: () => ({
        memorialId: selectedMemorial,
        customSubject,
        message,
        invitationCard,
      }),
      reset: () => {
        setInvitationCard(null);
        setPreviewUrl(null);
        setSelectedMemorial("");
        setCustomSubject("");
        setMessage("");
      },
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
          invitationErrors.validationFailed(
            "Please upload a valid image file (JPEG, PNG, GIF, or WebP)"
          );
          e.target.value = "";
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          invitationErrors.validationFailed(
            `Image size (${sizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`
          );
          e.target.value = "";
          return;
        }

        setInvitationCard(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleRemoveCard = () => {
      setInvitationCard(null);
      setPreviewUrl(null);
    };

    const memorials = memorialsData?.data?.memorials || [];
    const selectedMemorialData = memorials.find((m) => m.id === selectedMemorial);

    return (
      <div className="space-y-6">
        {/* Info Banner */}
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            theme === "dark"
              ? "bg-blue-900/20 border border-blue-800"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <MdInfo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className={`text-sm ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
            {t(
              "dashboard.invitations.wizard.step1Info",
              {},
              "Select the memorial page and customize your invitation message. You can add a personal touch with a custom subject line and message."
            )}
          </p>
        </div>

        {/* Memorial Selection */}
        <div className="space-y-2">
          <Label htmlFor="memorial" className="text-base font-medium">
            {t("dashboard.invitations.create.selectMemorial", {}, "Memorial Page")}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          {loadingMemorials ? (
            <MemorialSelectSkeleton />
          ) : (
            <Select value={selectedMemorial} onValueChange={setSelectedMemorial}>
              <SelectTrigger id="memorial" className="w-full">
                <SelectValue
                  placeholder={t(
                    "dashboard.invitations.create.selectMemorialPlaceholder",
                    {},
                    "Choose a memorial page..."
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {memorials.map((memorial) => (
                  <SelectItem key={memorial.id} value={memorial.id}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{memorial.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {memorial.birthDate && memorial.deathDate
                          ? `${format(new Date(memorial.birthDate), "MMM d, yyyy")} - ${format(new Date(memorial.deathDate), "MMM d, yyyy")}`
                          : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedMemorialData && (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.invitations.wizard.invitingGuests", {}, "Inviting guests to")}{" "}
              <span className="font-medium">{selectedMemorialData.name}&apos;s</span>{" "}
              {t("dashboard.invitations.wizard.memorialPage", {}, "memorial page")}
            </p>
          )}
        </div>

        {/* Custom Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-base font-medium">
            {t("dashboard.invitations.create.customSubject", {}, "Custom Email Subject")}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              {t("dashboard.invitations.wizard.optional", {}, "(Optional)")}
            </span>
          </Label>
          <Input
            id="subject"
            placeholder={t(
              "dashboard.invitations.wizard.subjectPlaceholder",
              {},
              "E.g., You're invited to celebrate a life well-lived"
            )}
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Personal Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-base font-medium">
            {t("dashboard.invitations.create.message", {}, "Personal Message")}
          </Label>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MdInfo className="w-4 h-4" />
            {t(
              "dashboard.invitations.create.messageInfo",
              {},
              "Edit the message below to personalize your invitation"
            )}
          </p>
          <Textarea
            id="message"
            placeholder={t(
              "dashboard.invitations.create.messagePlaceholder",
              {},
              "Add a personal message to your invitation..."
            )}
            value={
              message ||
              (selectedMemorialDetails
                ? t(
                    "dashboard.invitations.create.defaultMessage",
                    { memorialName: selectedMemorialDetails.name },
                    `We warmly invite you to join us in honoring the life and memory of ${selectedMemorialDetails.name}. Your presence would mean a lot to us as we celebrate their legacy and share cherished memories together.`
                  )
                : "")
            }
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {
              (
                message ||
                (selectedMemorialDetails
                  ? t(
                      "dashboard.invitations.create.defaultMessage",
                      { memorialName: selectedMemorialDetails.name },
                      `We warmly invite you to join us in honoring the life and memory of ${selectedMemorialDetails.name}. Your presence would mean a lot to us as we celebrate their legacy and share cherished memories together.`
                    )
                  : "")
              ).length
            }{" "}
            / 500 {t("dashboard.invitations.wizard.characters", {}, "characters")}
          </p>
        </div>

        {/* Invitation Card Upload */}
        <div className="space-y-2">
          <Label htmlFor="card" className="text-base font-medium">
            {t("dashboard.invitations.create.invitationCard", {}, "Invitation Card")}
            <span className="text-sm text-muted-foreground ml-2 font-normal">
              {t("dashboard.invitations.wizard.optional", {}, "(Optional)")}
            </span>
          </Label>
          <p className="text-sm text-muted-foreground">
            {t(
              "dashboard.invitations.wizard.cardDescription",
              {},
              "Upload a custom invitation card image (max 5MB)"
            )}
          </p>

          {previewUrl ? (
            <div className="relative inline-block">
              <div className="relative w-full max-w-xs rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                <Image
                  src={previewUrl}
                  alt="Invitation card preview"
                  width={400}
                  height={300}
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveCard}
                >
                  <MdClose className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <input
                id="card"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("card")?.click()}
              >
                <MdImage className="h-4 w-4 mr-2" />
                {t("dashboard.invitations.wizard.uploadCard", {}, "Upload Image")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

WizardStep1.displayName = "WizardStep1";
