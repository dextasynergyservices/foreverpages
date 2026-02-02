"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Video, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/useTheme";
import StreamList from "./StreamList";
import RecordingsList from "./RecordingsList";
import CreateStreamDialog from "./CreateStreamDialog";

interface Memorial {
  id: string;
  firstName: string;
  lastName: string;
  slug: string;
}

const Livestreams: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memorialIdFromUrl = searchParams?.get("memorial");
  const tabFromUrl = searchParams?.get("tab") || "streams";
  const [selectedMemorialId, setSelectedMemorialId] = useState<string>(memorialIdFromUrl || "");
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Check for stream end notification on mount
  useEffect(() => {
    const streamEnded = localStorage.getItem("streamEnded");
    if (streamEnded) {
      localStorage.removeItem("streamEnded");
      setRefreshKey((prev) => prev + 1);
    }
  }, []);

  // Fetch user's memorials
  useEffect(() => {
    async function fetchMemorials() {
      try {
        const response = await fetch("/api/user/memorials");
        if (response.ok) {
          const data = await response.json();
          const allMemorials = [
            ...(data.ownedMemorials || []),
            ...(data.collaboratorMemorials || []).map((cm: { memorial: Memorial }) => cm.memorial),
          ];
          setMemorials(allMemorials);

          // Auto-select first memorial if none selected
          if (!selectedMemorialId && allMemorials.length > 0) {
            setSelectedMemorialId(allMemorials[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch memorials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMemorials();
  }, [selectedMemorialId]);

  // Update URL when memorial is selected
  const handleMemorialChange = (memorialId: string) => {
    setSelectedMemorialId(memorialId);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("memorial", memorialId);
    params.set("tab", activeTab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    if (selectedMemorialId) {
      params.set("memorial", selectedMemorialId);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleStreamCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setCreateDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading memorials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (memorials.length === 0) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Memorials Found
          </h2>
          <p className="text-muted-foreground mb-6">
            You need to create a memorial page before you can manage livestreams.
          </p>
          <Button onClick={() => router.push("/user-dashboard?section=pageBuilder")}>
            Create Memorial Page
          </Button>
        </div>
      </div>
    );
  }

  const selectedMemorial = memorials.find((m) => m.id === selectedMemorialId);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className={`text-2xl lg:text-3xl font-bold ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Livestreams
            </h1>
            <p className="text-muted-foreground mt-1">Manage memorial livestreams and recordings</p>
          </div>
          {activeTab === "streams" && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={!selectedMemorialId}
            >
              <Plus className="h-4 w-4" />
              Create Stream
            </Button>
          )}
        </div>

        {/* Memorial Selector */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Select Memorial:
          </label>
          <Select value={selectedMemorialId} onValueChange={handleMemorialChange}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Choose a memorial..." />
            </SelectTrigger>
            <SelectContent>
              {memorials.map((memorial) => (
                <SelectItem key={memorial.id} value={memorial.id}>
                  {memorial.firstName} {memorial.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs */}
      {selectedMemorialId && selectedMemorial && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Managing{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedMemorial.firstName} {selectedMemorial.lastName}
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="streams" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Streams
              </TabsTrigger>
              <TabsTrigger value="recordings" className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Recordings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="streams">
              <StreamList memorialId={selectedMemorialId} refreshKey={refreshKey} />
            </TabsContent>

            <TabsContent value="recordings">
              <RecordingsList memorialId={selectedMemorialId} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create Stream Dialog */}
      <CreateStreamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        memorialId={selectedMemorialId || ""}
        onSuccess={handleStreamCreated}
      />
    </div>
  );
};

export default Livestreams;
