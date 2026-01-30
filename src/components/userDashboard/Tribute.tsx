"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Check,
  X,
  Clock,
  Heart,
  Flag,
  MessageCircle,
  Download,
  Image as ImageIcon,
  FileText,
  Video,
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { TributeCardSkeleton } from "@/components/ui/skeleton";
import { useTributes } from "@/hooks/useQueries";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { useOfflineTributes } from "@/hooks/useOfflineTributes";
import { useOfflineStatus } from "@/contexts/OfflineContext";
import { OfflineBanner, SyncProgress } from "@/components/ui/offline-indicator";
import { Tribute as OfflineTribute } from "@/lib/offline/db-schema";
import { toast } from "sonner";
import Image from "next/image";

interface ItemBase {
  id: string;
  author: string;
  email: string;
  message: string;
  relationship?: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  memorialName?: string;
  images?: string[];
  videos?: string[];
  attachments?: string[];
}

type Tribute = ItemBase;
type Condolence = ItemBase;

const TributesAndCondolences = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { isOnline } = useOfflineStatus();
  const { data: apiData, isLoading, error } = useTributes();
  const {
    tributes: offlineTributes,
    isLoading: offlineLoading,
    updateTribute,
  } = useOfflineTributes();

  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [condolences, setCondolences] = useState<Condolence[]>([]);
  const [activeSection, setActiveSection] = useState<"tributes" | "condolences">("tributes");

  // Use offline data when offline, online data when available
  const isCurrentlyLoading = isOnline ? isLoading : offlineLoading;

  // Convert offline tribute format to local format
  const convertOfflineTribute = (offlineTribute: OfflineTribute): Tribute => ({
    id: offlineTribute.id,
    author: offlineTribute.author.name || "Anonymous",
    email: offlineTribute.author.email || "",
    message: offlineTribute.message,
    date: offlineTribute.createdAt.toISOString().split("T")[0],
    status: offlineTribute.status,
    images: [],
    videos: [],
    attachments: [],
  });

  // Update local state when data loads
  React.useEffect(() => {
    if (isOnline && apiData?.data) {
      setTributes(apiData.data.tributes || []);
      setCondolences(apiData.data.condolences || []);
    } else if (!isOnline && offlineTributes) {
      const convertedTributes = offlineTributes.map(convertOfflineTribute);
      setTributes(convertedTributes);
    }
  }, [apiData, offlineTributes, isOnline]);

  const getStatusColor = (status: Tribute["status"]) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "flagged":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: Tribute["status"]) => {
    switch (status) {
      case "approved":
        return Check;
      case "pending":
        return Clock;
      case "rejected":
        return X;
      case "flagged":
        return Flag;
      default:
        return MessageSquare;
    }
  };

  // Generic update function for both tributes and condolences
  const updateItemStatus = async (
    id: string,
    newStatus: "approved" | "rejected" | "flagged",
    type: "tribute" | "condolence"
  ) => {
    if (isOnline) {
      try {
        const response = await fetch("/api/tributes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus }),
        });

        if (response.ok) {
          // Update local state
          if (type === "tribute") {
            setTributes(
              tributes.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
            );
          } else {
            setCondolences(
              condolences.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
            );
          }
          toast.success(
            `${type === "tribute" ? "Tribute" : "Condolence"} ${newStatus} successfully`
          );
        } else {
          toast.error("Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      }
    } else {
      // Offline: Use offline hook (tributes only for now)
      if (type === "tribute") {
        await updateTribute(id, { status: newStatus });
      }
    }
  };

  // Count calculations
  const tributePendingCount = tributes.filter((t) => t.status === "pending").length;
  const tributeApprovedCount = tributes.filter((t) => t.status === "approved").length;
  const tributeFlaggedCount = tributes.filter((t) => t.status === "flagged").length;

  const condolencePendingCount = condolences.filter((c) => c.status === "pending").length;
  const condolenceApprovedCount = condolences.filter((c) => c.status === "approved").length;
  const condolenceFlaggedCount = condolences.filter((c) => c.status === "flagged").length;

  const totalPendingCount = tributePendingCount + condolencePendingCount;

  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const activeTabClasses =
    theme === "dark"
      ? "data-[state=active]:bg-white data-[state=active]:text-black"
      : "data-[state=active]:bg-black data-[state=active]:text-white";

  const sectionBtnActive = theme === "dark" ? "bg-white text-black" : "bg-black text-white";
  const sectionBtnInactive =
    theme === "dark"
      ? "bg-white/10 text-white hover:bg-white/20"
      : "bg-gray-100 text-black hover:bg-gray-200";

  // Current items based on active section
  const currentItems = activeSection === "tributes" ? tributes : condolences;
  const currentPendingCount =
    activeSection === "tributes" ? tributePendingCount : condolencePendingCount;
  const currentApprovedCount =
    activeSection === "tributes" ? tributeApprovedCount : condolenceApprovedCount;
  const currentFlaggedCount =
    activeSection === "tributes" ? tributeFlaggedCount : condolenceFlaggedCount;

  // Helper to get filename from URL or generate one for base64
  const getFilenameFromUrl = (url: string, index: number = 0) => {
    // Handle base64 data URLs
    if (url.startsWith("data:")) {
      const mimeMatch = url.match(/data:([^;]+)/);
      const mimeType = mimeMatch?.[1] || "application/octet-stream";
      const ext = mimeType.split("/")[1]?.split("+")[0] || "file";
      return `attachment-${index + 1}.${ext}`;
    }
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || "file";
    } catch {
      return url.split("/").pop() || "file";
    }
  };

  // Helper to download base64 or regular files
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render a single item card
  const renderItemCard = (item: Tribute | Condolence, showActions = true) => {
    const StatusIcon = getStatusIcon(item.status);
    const itemType = activeSection === "tributes" ? "tribute" : "condolence";
    const hasMedia =
      (item.images && item.images.length > 0) ||
      (item.videos && item.videos.length > 0) ||
      (item.attachments && item.attachments.length > 0);

    return (
      <Card key={item.id} className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}>
                  {item.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{item.author}</h3>
                  {item.relationship && (
                    <span className={`text-sm ${textMuted}`}>({item.relationship})</span>
                  )}
                  <Badge variant={getStatusColor(item.status)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {item.status}
                  </Badge>
                  {hasMedia && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {t("dashboard.tributes.hasAttachments", {}, "Has files")}
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${textMuted}`}>
                  {item.email && `${item.email} • `}
                  {item.date}
                  {item.memorialName && (
                    <span className="ml-2 text-xs">• Memorial: {item.memorialName}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed mb-4">{item.message}</p>

          {/* Media/Files Section */}
          {hasMedia && (
            <div
              className={`mb-4 p-4 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}
            >
              <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textMuted}`}>
                <FileText className="h-4 w-4" />
                {t("dashboard.tributes.attachedFiles", {}, "Attached Files")}
              </h4>

              {/* Images */}
              {item.images && item.images.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs mb-2 ${textMuted}`}>
                    <ImageIcon className="h-3 w-3 inline mr-1" />
                    {t("dashboard.tributes.images", {}, "Images")} ({item.images.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {item.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square relative rounded-lg overflow-hidden border">
                          <Image
                            src={img}
                            alt={`${item.author}'s image ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleDownload(img, getFilenameFromUrl(img, idx))}
                          className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                            theme === "dark" ? "bg-black/60" : "bg-white/60"
                          } rounded-lg cursor-pointer`}
                        >
                          <Download className="h-6 w-6" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {item.videos && item.videos.length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs mb-2 ${textMuted}`}>
                    <Video className="h-3 w-3 inline mr-1" />
                    {t("dashboard.tributes.videos", {}, "Videos")} ({item.videos.length})
                  </p>
                  <div className="space-y-2">
                    {item.videos.map((video, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          theme === "dark" ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        <span className="text-sm truncate flex-1">
                          {getFilenameFromUrl(video, idx)}
                        </span>
                        <button
                          onClick={() => handleDownload(video, getFilenameFromUrl(video, idx))}
                          className={`ml-2 p-2 rounded-md hover:bg-opacity-80 cursor-pointer ${
                            theme === "dark" ? "hover:bg-white/20" : "hover:bg-gray-200"
                          }`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Attachments */}
              {item.attachments && item.attachments.length > 0 && (
                <div>
                  <p className={`text-xs mb-2 ${textMuted}`}>
                    <FileText className="h-3 w-3 inline mr-1" />
                    {t("dashboard.tributes.otherFiles", {}, "Other Files")} (
                    {item.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {item.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          theme === "dark" ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        <span className="text-sm truncate flex-1">
                          {getFilenameFromUrl(file, idx)}
                        </span>
                        <button
                          onClick={() => handleDownload(file, getFilenameFromUrl(file, idx))}
                          className={`ml-2 p-2 rounded-md hover:bg-opacity-80 cursor-pointer ${
                            theme === "dark" ? "hover:bg-white/20" : "hover:bg-gray-200"
                          }`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showActions && item.status !== "approved" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="memorial"
                size="sm"
                onClick={() => updateItemStatus(item.id, "approved", itemType)}
              >
                <Check className="h-4 w-4 mr-2" />
                {t("dashboard.tributes.actions.approve", {}, "Approve")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => updateItemStatus(item.id, "rejected", itemType)}
              >
                <X className="h-4 w-4 mr-2" />
                {t("dashboard.tributes.actions.reject", {}, "Reject")}
              </Button>
              {item.status !== "flagged" && (
                <Button
                  variant={theme === "dark" ? "memorial-ghost" : "outline"}
                  size="sm"
                  onClick={() => updateItemStatus(item.id, "flagged", itemType)}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {t("dashboard.tributes.actions.flag", {}, "Flag")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      {/* Offline indicators */}
      <OfflineBanner />
      <SyncProgress />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            {t("dashboard.tributes.title", {}, "Tributes & Condolences")}
          </h1>
          <p className={`mt-2 ${textMuted}`}>
            {t("dashboard.tributes.subtitle", {}, "Review and manage messages from visitors")}
          </p>
        </div>
        <div className="flex gap-4">
          <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
            <div className="text-2xl font-bold">
              {tributeApprovedCount + condolenceApprovedCount}
            </div>
            <div className={`text-sm ${textMuted}`}>
              {t("dashboard.tributes.tabs.approved", {}, "Approved")}
            </div>
          </Card>
          <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
            <div className="text-2xl font-bold text-secondary">{totalPendingCount}</div>
            <div className={`text-sm ${textMuted}`}>
              {t("dashboard.tributes.tabs.pending", {}, "Pending")}
            </div>
          </Card>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setActiveSection("tributes")}
          className={`flex items-center gap-2 ${activeSection === "tributes" ? sectionBtnActive : sectionBtnInactive}`}
        >
          <Heart className="h-4 w-4" />
          Tributes
          {tributePendingCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {tributePendingCount}
            </Badge>
          )}
        </Button>
        <Button
          onClick={() => setActiveSection("condolences")}
          className={`flex items-center gap-2 ${activeSection === "condolences" ? sectionBtnActive : sectionBtnInactive}`}
        >
          <MessageCircle className="h-4 w-4" />
          Condolences
          {condolencePendingCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {condolencePendingCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Stats for current section */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className={textMuted}>
          <span className="font-semibold">{currentItems.length}</span> total
        </span>
        <span className={textMuted}>
          <span className="font-semibold text-green-500">{currentApprovedCount}</span> approved
        </span>
        <span className={textMuted}>
          <span className="font-semibold text-yellow-500">{currentPendingCount}</span> pending
        </span>
        {currentFlaggedCount > 0 && (
          <span className={textMuted}>
            <span className="font-semibold text-red-500">{currentFlaggedCount}</span> flagged
          </span>
        )}
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:flex md:gap-2 md:overflow-visible">
          <TabsTrigger
            value="pending"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap relative ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.pending", {}, "Pending")}
            {currentPendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {currentPendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.approved", {}, "Approved")}
          </TabsTrigger>
          <TabsTrigger
            value="flagged"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.flagged", {}, "Flagged")}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.all", {}, "All")}
          </TabsTrigger>
        </TabsList>
        <div className="h-12 md:hidden" aria-hidden />

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            <>
              {currentItems
                .filter((item) => item.status === "pending")
                .map((item) => renderItemCard(item, true))}
              {currentItems.filter((item) => item.status === "pending").length === 0 && (
                <Card className={`border ${cardBorder} ${cardBg}`}>
                  <CardContent className="p-8 text-center">
                    {activeSection === "tributes" ? (
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    ) : (
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    )}
                    <h3 className="text-lg font-semibold mb-2">
                      {t("dashboard.tributes.empty.noPending", {}, "No pending items")}
                    </h3>
                    <p className={textMuted}>
                      {t(
                        "dashboard.tributes.empty.allReviewed",
                        {},
                        "All items have been reviewed"
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            <>
              {currentItems
                .filter((item) => item.status === "approved")
                .map((item) => renderItemCard(item, false))}
              {currentItems.filter((item) => item.status === "approved").length === 0 && (
                <Card className={`border ${cardBorder} ${cardBg}`}>
                  <CardContent className="p-8 text-center">
                    {activeSection === "tributes" ? (
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    ) : (
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    )}
                    <h3 className="text-lg font-semibold mb-2">No approved {activeSection}</h3>
                    <p className={textMuted}>Approved items will appear on the memorial page</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Flagged Tab */}
        <TabsContent value="flagged" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            <>
              {currentItems
                .filter((item) => item.status === "flagged")
                .map((item) => renderItemCard(item, true))}
              {currentItems.filter((item) => item.status === "flagged").length === 0 && (
                <Card className={`border ${cardBorder} ${cardBg}`}>
                  <CardContent className="p-8 text-center">
                    <Flag className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    <h3 className="text-lg font-semibold mb-2">No flagged {activeSection}</h3>
                    <p className={textMuted}>Flagged items will appear here for review</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            <>
              {currentItems.map((item) => renderItemCard(item, item.status !== "approved"))}
              {currentItems.length === 0 && (
                <Card className={`border ${cardBorder} ${cardBg}`}>
                  <CardContent className="p-8 text-center">
                    {activeSection === "tributes" ? (
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    ) : (
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    )}
                    <h3 className="text-lg font-semibold mb-2">No {activeSection} yet</h3>
                    <p className={textMuted}>
                      {activeSection === "tributes"
                        ? "Tributes from visitors will appear here"
                        : "Condolence messages from visitors will appear here"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TributesAndCondolences;
