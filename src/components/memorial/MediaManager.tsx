"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaUploader } from "./MediaUploader";
import { MediaGallery } from "./MediaGallery";
import { VideoEmbedDialog } from "./VideoEmbedDialog";
import { Image as ImageIcon, Video, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaManagerProps {
  memorialId: string;
  defaultTab?: "photos" | "videos" | "all";
  editable?: boolean;
  showUploader?: boolean;
  showAlbums?: boolean;
  className?: string;
}

export function MediaManager({
  memorialId,
  defaultTab = "photos",
  editable = false,
  showUploader = true,
  showAlbums = true,
  className,
}: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Refresh gallery
    setRefreshKey((prev) => prev + 1);
  };

  const handleMediaUpdate = () => {
    // Refresh gallery
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof defaultTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photos">
            <ImageIcon className="mr-2 h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="mr-2 h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="all">
            <FolderOpen className="mr-2 h-4 w-4" />
            All Media
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-6">
          {showUploader && editable && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Photos</CardTitle>
                <CardDescription>
                  Add photos to your memorial page. Supported formats: JPG, PNG, GIF, WebP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaUploader
                  memorialId={memorialId}
                  type="IMAGE"
                  onUploadComplete={handleUploadComplete}
                  maxFiles={20}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Photo Gallery</CardTitle>
                  <CardDescription>Browse and manage all photos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MediaGallery
                key={`photos-${refreshKey}`}
                memorialId={memorialId}
                type="IMAGE"
                editable={editable}
                showAlbums={showAlbums}
                columns={3}
                onMediaUpdate={handleMediaUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          {showUploader && editable && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Upload Videos</CardTitle>
                  <CardDescription>
                    Add videos to your memorial page. Supported formats: MP4, MOV, AVI, WMV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MediaUploader
                    memorialId={memorialId}
                    type="VIDEO"
                    onUploadComplete={handleUploadComplete}
                    maxFiles={5}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Embed Videos</CardTitle>
                  <CardDescription>Add videos from YouTube or Vimeo (Optional)</CardDescription>
                </CardHeader>
                <CardContent>
                  <VideoEmbedDialog
                    memorialId={memorialId}
                    onEmbed={handleUploadComplete}
                    trigger={
                      <Button variant="outline" className="w-full">
                        <Video className="mr-2 h-4 w-4" />
                        Embed YouTube or Vimeo Video
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Video Gallery</CardTitle>
              <CardDescription>Browse and manage all videos</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaGallery
                key={`videos-${refreshKey}`}
                memorialId={memorialId}
                type="VIDEO"
                editable={editable}
                showAlbums={showAlbums}
                columns={3}
                onMediaUpdate={handleMediaUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Media Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Media</CardTitle>
              <CardDescription>Browse all photos and videos in one place</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaGallery
                key={`all-${refreshKey}`}
                memorialId={memorialId}
                type="ALL"
                editable={editable}
                showAlbums={showAlbums}
                columns={3}
                onMediaUpdate={handleMediaUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
