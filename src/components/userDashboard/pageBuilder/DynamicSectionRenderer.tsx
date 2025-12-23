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
import { FamilyTreeEditor, FamilyTreeData } from "./sectionEditors/FamilyTreeEditor";
import { MemoriesEditor, MemoriesData } from "./sectionEditors/MemoriesEditor";
import { StoriesEditor, StoriesData } from "./sectionEditors/StoriesEditor";
import { MilitaryServiceEditor, MilitaryServiceData } from "./sectionEditors/MilitaryServiceEditor";
import { EducationCareerEditor, EducationCareerData } from "./sectionEditors/EducationCareerEditor";
import { MapLocationsEditor, MapLocationsData } from "./sectionEditors/MapLocationsEditor";
import { DocumentsEditor, DocumentsData } from "./sectionEditors/DocumentsEditor";
import { AudioMemoriesEditor, AudioMemoriesData } from "./sectionEditors/AudioMemoriesEditor";
import { useTheme } from "@/hooks/useTheme";

// Define VirtualCandlesData type
export interface VirtualCandlesData {
  candles: Array<{
    id: string;
    lightedBy: string;
    createdAt: string;
    message?: string;
  }>;
  allowPublic: boolean;
}

export type SectionType =
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
  FAMILY_TREE?: FamilyTreeData;
  MEMORIES?: MemoriesData;
  STORIES?: StoriesData;
  MILITARY_SERVICE?: MilitaryServiceData;
  EDUCATION_CAREER?: EducationCareerData;
  MAP_LOCATIONS?: MapLocationsData;
  DOCUMENTS?: DocumentsData;
  AUDIO_MEMORIES?: AudioMemoriesData;
  VIRTUAL_CANDLES?: VirtualCandlesData;
  [key: string]: unknown;
};

interface DynamicSectionRendererProps {
  supportedSections: SectionType[];
  sectionData: SectionData;
  onSectionDataChange: (section: SectionType, data: unknown) => void;
  onOpenMediaPicker?: () => void;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
    profilePhoto?: string;
  };
  onMemorialDataChange?: (data: Partial<DynamicSectionRendererProps["memorialData"]>) => void;
}

export const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({
  supportedSections,
  sectionData,
  onSectionDataChange,
  onOpenMediaPicker,
  memorialData,
  onMemorialDataChange,
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
            memorialData={memorialData}
            onMemorialDataChange={onMemorialDataChange}
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
            onChange={(data) => {
              console.log("DynamicSectionRenderer: Gallery onChange called with:", data);
              onSectionDataChange("GALLERY", data);
            }}
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

      case "VIRTUAL_CANDLES":
        return (
          <div
            className={`p-6 rounded-lg border ${
              theme === "dark" ? "border-white/10 bg-gray-800" : "border-gray-200 bg-gray-50"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Virtual Candles</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Allow Public Candle Lighting
                </label>
                <input
                  type="checkbox"
                  checked={sectionData.VIRTUAL_CANDLES?.allowPublic ?? true}
                  onChange={(e) =>
                    onSectionDataChange("VIRTUAL_CANDLES", {
                      ...(sectionData.VIRTUAL_CANDLES || {}),
                      allowPublic: e.target.checked,
                      candles: sectionData.VIRTUAL_CANDLES?.candles || [],
                    })
                  }
                  className="rounded border-gray-300"
                />
              </div>
              <p className="text-sm text-gray-600">
                Visitors can light virtual candles in memory. Currently{" "}
                {sectionData.VIRTUAL_CANDLES?.candles?.length || 0} candles lit.
              </p>
            </div>
          </div>
        );

      // Placeholder for sections not yet implemented
      case "FAMILY_TREE":
        return (
          <FamilyTreeEditor
            data={
              sectionData.FAMILY_TREE || {
                members: [],
                layout: "tree",
                showPhotos: true,
                showDates: true,
              }
            }
            onChange={(data) => onSectionDataChange("FAMILY_TREE", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "MEMORIES":
        return (
          <MemoriesEditor
            data={
              sectionData.MEMORIES || {
                memories: [],
                allowPublicSubmissions: true,
                requireApproval: false,
                categories: [],
              }
            }
            onChange={(data) => onSectionDataChange("MEMORIES", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "STORIES":
        return (
          <StoriesEditor
            data={
              sectionData.STORIES || {
                stories: [],
                allowPublicSubmissions: true,
                requireApproval: false,
                showAuthor: true,
              }
            }
            onChange={(data) => onSectionDataChange("STORIES", data)}
          />
        );

      case "MILITARY_SERVICE":
        return (
          <MilitaryServiceEditor
            data={
              sectionData.MILITARY_SERVICE || {
                service: { branch: "", rank: "", yearsOfService: "" },
                showOnMemorial: true,
                displayFormat: "detailed",
              }
            }
            onChange={(data) => onSectionDataChange("MILITARY_SERVICE", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "EDUCATION_CAREER":
        return (
          <EducationCareerEditor
            data={
              sectionData.EDUCATION_CAREER || {
                education: [],
                career: [],
                showEducation: true,
                showCareer: true,
              }
            }
            onChange={(data) => onSectionDataChange("EDUCATION_CAREER", data)}
          />
        );

      case "MAP_LOCATIONS":
        return (
          <MapLocationsEditor
            data={
              sectionData.MAP_LOCATIONS || {
                locations: [],
                zoomLevel: 10,
                showDirections: true,
              }
            }
            onChange={(data) => onSectionDataChange("MAP_LOCATIONS", data)}
          />
        );

      case "DOCUMENTS":
        return (
          <DocumentsEditor
            data={
              sectionData.DOCUMENTS || {
                documents: [],
                allowPublicUploads: true,
                requireApproval: false,
                maxFileSize: 10,
                allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png"],
              }
            }
            onChange={(data) => onSectionDataChange("DOCUMENTS", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "AUDIO_MEMORIES":
        return (
          <AudioMemoriesEditor
            data={
              sectionData.AUDIO_MEMORIES || {
                audioMemories: [],
                allowPublicUploads: true,
                requireApproval: false,
                maxFileSize: 10,
                allowedFormats: ["mp3", "wav", "m4a"],
              }
            }
            onChange={(data) => onSectionDataChange("AUDIO_MEMORIES", data)}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        );

      case "VIRTUAL_FLOWERS":
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
