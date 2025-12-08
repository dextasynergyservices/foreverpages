"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemorial } from "@/hooks/useMemorial";
import { TemplateRenderer } from "@/components/userDashboard/pageBuilder/TemplateRenderer";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";
import { SectionData } from "@/components/userDashboard/pageBuilder/DynamicSectionRenderer";
import { useTheme } from "@/hooks/useTheme";
import { Calendar, Edit, Share2, Heart, Eye, Loader2, AlertCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();
  useSession();
  const { theme } = useTheme();
  const slug = params?.slug as string;

  const { data, isLoading, error } = useMemorial(slug);

  const memorial = data?.data?.memorial;
  const isOwner = data?.data?.isOwner || false;

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-black" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const borderClass = isDark ? "border-white/10" : "border-gray-200";

  // Default design tokens
  const defaultDesign: DesignTokens = {
    colors: {
      primary: "#1f2937",
      secondary: "#6366f1",
      accent: "#ec4899",
      headerBg: "#111827",
      headerText: "#ffffff",
      bodyBg: "#f9fafb",
      bodyText: "#1f2937",
    },
    fonts: { fontFamily: "Inter", headingSize: "large", bodySize: "medium" },
    layout: {
      spacing: "comfortable",
      borderRadius: "moderate",
      containerWidth: "standard",
    },
  };

  // Extract design tokens and section data from userTemplate
  const designTokens: DesignTokens =
    (memorial?.userTemplate?.config as DesignTokens) || defaultDesign;
  const sectionData: SectionData = (memorial?.userTemplate?.sections as SectionData) || {};
  const supportedSections = memorial?.userTemplate?.baseTemplate?.supportedSections || [];

  // Format dates
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    const title = `${memorial?.firstName} ${memorial?.lastName} - Memorial Page`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        toast.success("Shared successfully");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast.error("Failed to copy link");
      }
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (memorial?.userTemplate?.id) {
      router.push(`/user-dashboard?section=funeral-builder&edit=${memorial.userTemplate.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${textClass}`} />
          <p className={textClass}>Loading memorial...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !memorial) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass} p-6`}>
        <div className={`text-center max-w-md`}>
          <AlertCircle
            className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-red-400" : "text-red-600"}`}
          />
          <h1 className={`text-2xl font-bold mb-2 ${textClass}`}>Memorial Not Found</h1>
          <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {error instanceof Error
              ? error.message
              : "This memorial page doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Unpublished state (only shown to owner)
  if (!memorial.isPublished && isOwner) {
    return (
      <div className={`min-h-screen ${bgClass}`}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div
            className={`border rounded-lg p-8 text-center ${borderClass} ${
              isDark ? "bg-yellow-500/10" : "bg-yellow-50"
            }`}
          >
            <Lock
              className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-yellow-400" : "text-yellow-600"}`}
            />
            <h1 className={`text-2xl font-bold mb-2 ${textClass}`}>Memorial Not Published</h1>
            <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              This memorial is not yet published. Only you can see this page.
            </p>
            <button
              onClick={handleEdit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Edit & Publish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare memorial data for renderer
  const memorialData = {
    firstName: memorial.firstName,
    lastName: memorial.lastName,
    birthDate: memorial.birthDate,
    deathDate: memorial.deathDate,
    birthYear: new Date(memorial.birthDate).getFullYear(),
    deathYear: new Date(memorial.deathDate).getFullYear(),
    biography: memorial.biography,
  };

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Action Bar - Fixed at top for owner */}
      {isOwner && (
        <div
          className={`sticky top-0 z-50 border-b ${borderClass} ${
            isDark ? "bg-black/95 backdrop-blur" : "bg-white/95 backdrop-blur"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Viewing as owner
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{memorial.viewCount} views</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-white/10 hover:bg-white/20 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit Memorial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share button for non-owners */}
      {!isOwner && (
        <div className={`border-b ${borderClass}`}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex justify-end">
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900"
              }`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Memorial Content */}
      <TemplateRenderer
        designTokens={designTokens}
        sectionData={sectionData}
        memorialData={memorialData}
        supportedSections={supportedSections}
      />

      {/* Memorial Stats Footer */}
      <footer className={`border-t ${borderClass} py-8 mt-12`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Eye
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              />
              <p className={`text-2xl font-bold ${textClass}`}>{memorial.viewCount}</p>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Views</p>
            </div>
            <div>
              <Heart
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              />
              <p className={`text-2xl font-bold ${textClass}`}>{memorial.candles?.length || 0}</p>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Candles</p>
            </div>
            <div>
              <Share2
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              />
              <p className={`text-2xl font-bold ${textClass}`}>{memorial.shareCount}</p>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Shares</p>
            </div>
            <div>
              <Calendar
                className={`w-6 h-6 mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              />
              <p className={`text-2xl font-bold ${textClass}`}>
                {Math.abs(
                  new Date(memorial.deathDate).getFullYear() -
                    new Date(memorial.birthDate).getFullYear()
                )}
              </p>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Years</p>
            </div>
          </div>

          <div className={`mt-8 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
            <p>
              Memorial created{" "}
              {formatDate(memorial.userTemplate?.baseTemplate?.id || new Date().toISOString())} •
              Powered by ForeverPages
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
