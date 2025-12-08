"use client";

import React from "react";
import { BiographyEditor, BiographyData } from "./sectionEditors/BiographyEditor";
import { GalleryEditor, GalleryData } from "./sectionEditors/GalleryEditor";
import { TimelineEditor, TimelineData } from "./sectionEditors/TimelineEditor";
import { TributesEditor, TributesData } from "./sectionEditors/TributesEditor";
import { HeroEditor, HeroData } from "./sectionEditors/HeroEditor";
import { FuneralInfoEditor, FuneralInfoData } from "./sectionEditors/FuneralInfoEditor";
import { AchievementsEditor, AchievementsData } from "./sectionEditors/AchievementsEditor";
import { VideoGalleryEditor, VideoGalleryData } from "./sectionEditors/VideoGalleryEditor";
import { QuotesEditor, QuotesData } from "./sectionEditors/QuotesEditor";
import { CondolencesEditor, CondolencesData } from "./sectionEditors/CondolencesEditor";
import { DonationsEditor, DonationsData } from "./sectionEditors/DonationsEditor";
import { GuestbookEditor, GuestbookData } from "./sectionEditors/GuestbookEditor";
import { PhotoAlbumEditor, PhotoAlbumData } from "./sectionEditors/PhotoAlbumEditor";
import { CustomSectionEditor, CustomSectionData } from "./sectionEditors/CustomSectionEditor";
import { useTheme } from "@/hooks/useTheme";

type SectionType =
  | "HERO"
  | "BIOGRAPHY"
  | "GALLERY"
  | "TIMELINE"
  | "FAMILY_TREE"
  | "TRIBUTES"
  | "CONDOLENCES"
  | "GUESTBOOK"
  | "DONATIONS"
  | "FUNERAL_INFO"
  | "MEMORIES"
  | "STORIES"
  | "ACHIEVEMENTS"
  | "MILITARY_SERVICE"
  | "EDUCATION_CAREER"
  | "PHOTO_ALBUM"
  | "VIDEO_GALLERY"
  | "AUDIO_MEMORIES"
  | "DOCUMENTS"
  | "VIRTUAL_CANDLES"
  | "VIRTUAL_FLOWERS"
  | "MAP_LOCATIONS"
  | "TESTIMONIALS"
  | "QUOTES"
  | "CUSTOM";

export type SectionData = {
  BIOGRAPHY?: BiographyData;
  GALLERY?: GalleryData;
  TIMELINE?: TimelineData;
  TRIBUTES?: TributesData;
  HERO?: HeroData;
  FUNERAL_INFO?: FuneralInfoData;
  ACHIEVEMENTS?: AchievementsData;
  VIDEO_GALLERY?: VideoGalleryData;
  QUOTES?: QuotesData;
  CONDOLENCES?: CondolencesData;
  DONATIONS?: DonationsData;
  GUESTBOOK?: GuestbookData;
  PHOTO_ALBUM?: PhotoAlbumData;
  CUSTOM?: CustomSectionData;
  [key: string]: unknown;
};

interface DynamicSectionRendererProps {
  supportedSections: SectionType[];
  sectionData: SectionData;
  onSectionDataChange: (section: SectionType, data: unknown) => void;
  onOpenMediaPicker?: () => void;
}

export const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({
  supportedSections,
  sectionData,
  onSectionDataChange,
  onOpenMediaPicker,
}) => {
  const { theme } = useTheme();

  const renderSectionEditor = (sectionType: SectionType) => {
    switch (sectionType) {
      case "HERO":
        return (
          <HeroEditor
            data={sectionData.HERO || {}}
            onChange={(data) => onSectionDataChange("HERO", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "BIOGRAPHY":
        return (
          <BiographyEditor
            data={
              sectionData.BIOGRAPHY || {
                fullStory: "",
                birthDate: "",
                deathDate: "",
                birthPlace: "",
              }
            }
            onChange={(data) => onSectionDataChange("BIOGRAPHY", data)}
          />
        );

      case "GALLERY":
        return (
          <GalleryEditor
            data={sectionData.GALLERY || { items: [], layout: "grid" }}
            onChange={(data) => onSectionDataChange("GALLERY", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "TIMELINE":
        return (
          <TimelineEditor
            data={sectionData.TIMELINE || { events: [] }}
            onChange={(data) => onSectionDataChange("TIMELINE", data)}
          />
        );

      case "TRIBUTES":
      case "TESTIMONIALS":
        return (
          <TributesEditor
            data={sectionData.TRIBUTES || { tributes: [], allowPublicTributes: true }}
            onChange={(data) => onSectionDataChange("TRIBUTES", data)}
          />
        );

      case "FUNERAL_INFO":
        return (
          <FuneralInfoEditor
            data={sectionData.FUNERAL_INFO || {}}
            onChange={(data) => onSectionDataChange("FUNERAL_INFO", data)}
          />
        );

      case "ACHIEVEMENTS":
        return (
          <AchievementsEditor
            data={sectionData.ACHIEVEMENTS || { achievements: [] }}
            onChange={(data) => onSectionDataChange("ACHIEVEMENTS", data)}
          />
        );

      case "VIDEO_GALLERY":
        return (
          <VideoGalleryEditor
            data={sectionData.VIDEO_GALLERY || { videos: [] }}
            onChange={(data) => onSectionDataChange("VIDEO_GALLERY", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "QUOTES":
        return (
          <QuotesEditor
            data={sectionData.QUOTES || { quotes: [] }}
            onChange={(data) => onSectionDataChange("QUOTES", data)}
          />
        );

      case "CONDOLENCES":
        return (
          <CondolencesEditor
            data={
              sectionData.CONDOLENCES || {
                allowPublicCondolences: true,
                requireApproval: false,
                condolences: [],
              }
            }
            onChange={(data) => onSectionDataChange("CONDOLENCES", data)}
          />
        );

      case "DONATIONS":
        return (
          <DonationsEditor
            data={sectionData.DONATIONS || { enabled: true, organizations: [] }}
            onChange={(data) => onSectionDataChange("DONATIONS", data)}
          />
        );

      case "GUESTBOOK":
        return (
          <GuestbookEditor
            data={
              sectionData.GUESTBOOK || {
                enabled: true,
                requireApproval: false,
                entries: [],
              }
            }
            onChange={(data) => onSectionDataChange("GUESTBOOK", data)}
          />
        );

      case "PHOTO_ALBUM":
        return (
          <PhotoAlbumEditor
            data={sectionData.PHOTO_ALBUM || { albums: [] }}
            onChange={(data) => onSectionDataChange("PHOTO_ALBUM", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "CUSTOM":
        return (
          <CustomSectionEditor
            data={sectionData.CUSTOM || {}}
            onChange={(data) => onSectionDataChange("CUSTOM", data)}
          />
        );

      // Placeholder for sections not yet implemented
      case "FAMILY_TREE":
      case "MEMORIES":
      case "STORIES":
      case "MILITARY_SERVICE":
      case "EDUCATION_CAREER":
      case "AUDIO_MEMORIES":
      case "DOCUMENTS":
      case "VIRTUAL_CANDLES":
      case "VIRTUAL_FLOWERS":
      case "MAP_LOCATIONS":
        return (
          <div
            className={`p-6 rounded-lg border-2 border-dashed ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 capitalize">
              {sectionType.replace(/_/g, " ").toLowerCase()}
            </h3>
            <p className={theme === "dark" ? "text-white/70" : "text-gray-600"}>
              Editor for this section is coming soon.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {supportedSections.map((sectionType) => (
        <div key={sectionType} id={`section-${sectionType}`}>
          {renderSectionEditor(sectionType)}
        </div>
      ))}

      {supportedSections.length === 0 && (
        <div
          className={`text-center py-12 border-2 border-dashed rounded-lg ${
            theme === "dark" ? "border-white/10" : "border-gray-200"
          }`}
        >
          <p className={theme === "dark" ? "text-white/70" : "text-gray-600"}>
            No sections available for this template
          </p>
        </div>
      )}
    </div>
  );
};
