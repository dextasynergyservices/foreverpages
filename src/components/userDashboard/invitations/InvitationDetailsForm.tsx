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
import { MdClose, MdImage } from "react-icons/md";
import { useMemorials } from "@/hooks/useMemorials";
import { format } from "date-fns";
import { invitationErrors, invitationInfo } from "@/lib/invitationToasts";
import { MemorialSelectSkeleton } from "./SkeletonLoaders";

interface InvitationDetailsFormProps {
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export interface InvitationDetailsFormHandle {
  getData: () => {
    memorialId: string;
    customSubject: string;
    message: string;
    invitationCard: File | null;
  };
}

export const InvitationDetailsForm = forwardRef<
  InvitationDetailsFormHandle,
  InvitationDetailsFormProps
>(({ t }, ref) => {
  const [invitationCard, setInvitationCard] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMemorial, setSelectedMemorial] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const { data: memorialsData, isLoading: loadingMemorials } = useMemorials();

  useImperativeHandle(ref, () => ({
    getData: () => ({
      memorialId: selectedMemorial,
      customSubject,
      message,
      invitationCard,
    }),
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
        e.target.value = ""; // Reset input
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        invitationErrors.validationFailed(
          `Image size (${sizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`
        );
        e.target.value = ""; // Reset input
        return;
      }

      setInvitationCard(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      invitationInfo.loading(`${file.name} selected successfully`);
    }
  };

  const handleRemoveCard = () => {
    setInvitationCard(null);
    setPreviewUrl(null);
  };

  const memorials = memorialsData?.data.memorials || [];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex-1 space-y-4">
        {/* Memorial Selection */}
        {loadingMemorials ? (
          <MemorialSelectSkeleton />
        ) : (
          <div>
            <Label htmlFor="memorial-select">
              {t("dashboard.invitations.create.selectMemorial", {}, "Select Memorial")}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select value={selectedMemorial} onValueChange={setSelectedMemorial}>
              <SelectTrigger id="memorial-select" className="w-full">
                <SelectValue placeholder="Choose the memorial page for this invitation" />
              </SelectTrigger>
              <SelectContent>
                {memorials.length === 0 && !loadingMemorials && (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No memorials found. Create a memorial first.
                  </div>
                )}
                {memorials.map((memorial) => (
                  <SelectItem key={memorial.id} value={memorial.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{memorial.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(memorial.birthDate), "MMM d, yyyy")} -{" "}
                        {format(new Date(memorial.deathDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              The memorial page where invitees will be granted access
            </p>
          </div>
        )}

        {/* Custom Subject */}
        <div>
          <Label htmlFor="invitation-subject">
            {t("dashboard.invitations.create.emailSubject")}
          </Label>
          <Input
            id="invitation-subject"
            placeholder="You're invited to remember [Name]"
            className="w-full"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Leave blank to use default subject</p>
        </div>

        {/* Invitation Card Upload */}
        <div>
          <Label htmlFor="invitation-card">
            {t("dashboard.invitations.create.invitationCard", {}, "Invitation Card (Optional)")}
          </Label>
          {!previewUrl ? (
            <div className="mt-2">
              <label
                htmlFor="invitation-card"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <MdImage className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center px-2">
                    Click to upload invitation card
                    <br />
                    <span className="text-xs">PNG, JPG, GIF up to 5MB</span>
                  </p>
                </div>
                <input
                  id="invitation-card"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="mt-2 relative">
              <div className="relative rounded-lg overflow-hidden border h-48">
                <Image
                  src={previewUrl}
                  alt="Invitation card preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={handleRemoveCard}
                >
                  <MdClose className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{invitationCard?.name}</p>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <Label htmlFor="invitation-message">
            {t("dashboard.invitations.create.personalMessage")}
          </Label>
          <Textarea
            id="invitation-message"
            placeholder="Add a personal message to your invitation..."
            rows={6}
            className="flex-1 min-h-[150px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your personal message will appear in the invitation
          </p>
        </div>
      </div>
    </div>
  );
});

InvitationDetailsForm.displayName = "InvitationDetailsForm";
