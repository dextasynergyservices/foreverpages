"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Settings,
  MessageSquare,
  Heart,
  Camera,
  Mic,
  RectangleHorizontal,
  Plus,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface CameraSource {
  id: string;
  label: string;
  deviceId: string;
}

interface AudioSource {
  id: string;
  label: string;
  deviceId: string;
}

interface StreamSettingsPanelProps {
  streamId: string;
  enableChat: boolean;
  enableReactions: boolean;
  localStream: MediaStream | null;
  onChatToggle: (enabled: boolean) => void;
  onReactionsToggle: (enabled: boolean) => void;
  onCameraChange: (deviceId: string) => void;
  onAudioChange: (deviceId: string) => void;
  onBackgroundBlurToggle: (enabled: boolean) => void;
  onAspectRatioChange: (ratio: string) => void;
}

const StreamSettingsPanel: React.FC<StreamSettingsPanelProps> = ({
  streamId,
  enableChat,
  enableReactions,
  localStream,
  onChatToggle,
  onReactionsToggle,
  onCameraChange,
  onAudioChange,
  onBackgroundBlurToggle,
  onAspectRatioChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Media devices
  const [cameras, setCameras] = useState<CameraSource[]>([]);
  const [microphones, setMicrophones] = useState<AudioSource[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");

  // Settings
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [microphoneVolume, setMicrophoneVolume] = useState([100]);
  const [systemAudioVolume, setSystemAudioVolume] = useState([50]);

  // Moderation settings
  const [keywordBlacklist, setKeywordBlacklist] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [slowModeInterval, setSlowModeInterval] = useState(0);
  const [slowModeEnabled, setSlowModeEnabled] = useState(false);

  // Loading states
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Load available media devices
  useEffect(() => {
    loadMediaDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
          deviceId: device.deviceId,
        }));

      const audioDevices = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
          deviceId: device.deviceId,
        }));

      setCameras(videoDevices);
      setMicrophones(audioDevices);

      // Set currently active devices
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];

        if (videoTrack) {
          const settings = videoTrack.getSettings();
          setSelectedCamera(settings.deviceId || "");
        }

        if (audioTrack) {
          const settings = audioTrack.getSettings();
          setSelectedMicrophone(settings.deviceId || "");
        }
      }
    } catch (error) {
      console.error("Failed to load media devices:", error);
      toast.error("Failed to load camera and microphone devices");
    }
  };

  const handleRefreshDevices = async () => {
    setRefreshing(true);
    await loadMediaDevices();
    setRefreshing(false);
    toast.success("Devices refreshed!");
  };

  const handleChatToggle = async (enabled: boolean) => {
    try {
      setUpdating(true);

      const response = await fetch(`/api/streams/${streamId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableChat: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update chat settings");
      }

      onChatToggle(enabled);
      toast.success(enabled ? "Chat enabled" : "Chat disabled");
    } catch (error) {
      console.error("Failed to toggle chat:", error);
      toast.error("Failed to update chat settings");
    } finally {
      setUpdating(false);
    }
  };

  const handleReactionsToggle = async (enabled: boolean) => {
    try {
      setUpdating(true);

      const response = await fetch(`/api/streams/${streamId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableReactions: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reactions settings");
      }

      onReactionsToggle(enabled);
      toast.success(enabled ? "Reactions enabled" : "Reactions disabled");
    } catch (error) {
      console.error("Failed to toggle reactions:", error);
      toast.error("Failed to update reactions settings");
    } finally {
      setUpdating(false);
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    onCameraChange(deviceId);
    toast.success("Camera switched");
  };

  const handleMicrophoneChange = (deviceId: string) => {
    setSelectedMicrophone(deviceId);
    onAudioChange(deviceId);
    toast.success("Microphone switched");
  };

  const handleBackgroundBlurToggle = (enabled: boolean) => {
    setBackgroundBlur(enabled);
    onBackgroundBlurToggle(enabled);
    toast.success(enabled ? "Background blur enabled" : "Background blur disabled");
  };

  const handleAspectRatioChange = (ratio: string) => {
    setAspectRatio(ratio);
    onAspectRatioChange(ratio);
    toast.success(`Aspect ratio changed to ${ratio}`);
  };

  const handleMicrophoneVolumeChange = (value: number[]) => {
    setMicrophoneVolume(value);

    // Apply volume to audio track
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        // Note: Volume control requires Web Audio API
        // This is a placeholder - actual implementation would use AudioContext
        console.log("Setting microphone volume to:", value[0]);
      }
    }
  };

  const handleAddCamera = () => {
    toast("Connect a new camera and click 'Refresh Devices'");
  };

  // Moderation handlers
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    const keyword = newKeyword.trim().toLowerCase();
    if (keywordBlacklist.includes(keyword)) {
      toast.error("This keyword is already in the blacklist");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/streams/${streamId}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordBlacklist: [...keywordBlacklist, keyword],
        }),
      });

      if (!response.ok) throw new Error("Failed to update blacklist");

      setKeywordBlacklist((prev) => [...prev, keyword]);
      setNewKeyword("");
      toast.success(`Added "${keyword}" to blacklist`);
    } catch (error) {
      console.error("Failed to add keyword:", error);
      toast.error("Failed to add keyword");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    setUpdating(true);
    try {
      const newList = keywordBlacklist.filter((k) => k !== keyword);
      const response = await fetch(`/api/streams/${streamId}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordBlacklist: newList,
        }),
      });

      if (!response.ok) throw new Error("Failed to update blacklist");

      setKeywordBlacklist(newList);
      toast.success(`Removed "${keyword}" from blacklist`);
    } catch (error) {
      console.error("Failed to remove keyword:", error);
      toast.error("Failed to remove keyword");
    } finally {
      setUpdating(false);
    }
  };

  const handleSlowModeToggle = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const interval = enabled ? slowModeInterval || 10 : 0;
      const response = await fetch(`/api/streams/${streamId}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slowModeInterval: interval,
        }),
      });

      if (!response.ok) throw new Error("Failed to update slow mode");

      setSlowModeEnabled(enabled);
      if (enabled && slowModeInterval === 0) {
        setSlowModeInterval(10);
      }
      toast.success(enabled ? "Slow mode enabled" : "Slow mode disabled");
    } catch (error) {
      console.error("Failed to toggle slow mode:", error);
      toast.error("Failed to update slow mode");
    } finally {
      setUpdating(false);
    }
  };

  const handleSlowModeIntervalChange = async (value: number) => {
    setSlowModeInterval(value);

    // Debounce API call
    const windowWithTimeout = window as Window & { slowModeTimeout?: NodeJS.Timeout };
    if (windowWithTimeout.slowModeTimeout) {
      clearTimeout(windowWithTimeout.slowModeTimeout);
    }
    windowWithTimeout.slowModeTimeout = setTimeout(async () => {
      setUpdating(true);
      try {
        const response = await fetch(`/api/streams/${streamId}/moderation`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slowModeInterval: value,
          }),
        });

        if (!response.ok) throw new Error("Failed to update slow mode interval");

        toast.success(`Slow mode set to ${value}s`);
      } catch (error) {
        console.error("Failed to update interval:", error);
        toast.error("Failed to update interval");
      } finally {
        setUpdating(false);
      }
    }, 500);
  };

  // Load moderation settings
  useEffect(() => {
    const loadModerationSettings = async () => {
      try {
        const response = await fetch(`/api/streams/${streamId}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.keywordBlacklist) {
          setKeywordBlacklist(data.keywordBlacklist);
        }
        if (data.slowModeInterval !== undefined) {
          setSlowModeInterval(data.slowModeInterval);
          setSlowModeEnabled(data.slowModeInterval > 0);
        }
      } catch (error) {
        console.error("Failed to load moderation settings:", error);
      }
    };

    loadModerationSettings();
  }, [streamId]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Stream Settings</SheetTitle>
          <SheetDescription>Configure your livestream settings and media devices</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="engagement" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chat & Reactions</CardTitle>
                  <CardDescription>
                    Control viewer engagement features during the stream
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Chat Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="chat-toggle" className="font-medium">
                          Live Chat
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow viewers to post comments
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="chat-toggle"
                      checked={enableChat}
                      onCheckedChange={handleChatToggle}
                      disabled={updating}
                    />
                  </div>

                  {/* Reactions Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="reactions-toggle" className="font-medium">
                          Reactions
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow hearts, prayers, candles, etc.
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="reactions-toggle"
                      checked={enableReactions}
                      onCheckedChange={handleReactionsToggle}
                      disabled={updating}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Moderation Tab */}
            <TabsContent value="moderation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Keyword Filter</CardTitle>
                  <CardDescription>
                    Auto-hide comments containing inappropriate words
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Keyword */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add word to blacklist..."
                      className="flex-1 px-3 py-2 text-sm border rounded-md"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newKeyword.trim()) {
                          handleAddKeyword();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim() || updating}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Keyword List */}
                  {keywordBlacklist.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Blacklisted Words ({keywordBlacklist.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {keywordBlacklist.map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md text-sm"
                          >
                            <span>{keyword}</span>
                            <button
                              onClick={() => handleRemoveKeyword(keyword)}
                              className="ml-1 hover:text-red-600"
                              aria-label="Remove keyword"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {keywordBlacklist.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No keywords added. Comments are not being filtered.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Slow Mode</CardTitle>
                  <CardDescription>Limit how frequently viewers can post comments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slow Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="slow-mode-toggle" className="font-medium">
                        Enable Slow Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {slowModeEnabled
                          ? `Users can post every ${slowModeInterval}s`
                          : "Users can post without delay"}
                      </p>
                    </div>
                    <Switch
                      id="slow-mode-toggle"
                      checked={slowModeEnabled}
                      onCheckedChange={handleSlowModeToggle}
                      disabled={updating}
                    />
                  </div>

                  {/* Slow Mode Interval */}
                  {slowModeEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="slow-mode-interval">Interval (seconds)</Label>
                        <span className="text-sm text-muted-foreground">{slowModeInterval}s</span>
                      </div>
                      <Slider
                        id="slow-mode-interval"
                        value={[slowModeInterval]}
                        onValueChange={(value) => handleSlowModeIntervalChange(value[0])}
                        min={5}
                        max={120}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 10-30 seconds for memorial services
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Camera Sources</CardTitle>
                      <CardDescription>Select and manage camera devices</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshDevices}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Camera Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="camera-select">Active Camera</Label>
                    <Select value={selectedCamera} onValueChange={handleCameraChange}>
                      <SelectTrigger id="camera-select">
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {cameras.map((camera) => (
                          <SelectItem key={camera.id} value={camera.deviceId}>
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4" />
                              {camera.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {cameras.length} camera(s) detected
                    </p>
                  </div>

                  {/* Add Camera Hint */}
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleAddCamera}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Camera
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Connect a new camera device, then click Refresh to detect it
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Audio Sources</CardTitle>
                  <CardDescription>Microphone and audio settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Microphone Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="microphone-select">Active Microphone</Label>
                    <Select value={selectedMicrophone} onValueChange={handleMicrophoneChange}>
                      <SelectTrigger id="microphone-select">
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {microphones.map((mic) => (
                          <SelectItem key={mic.id} value={mic.deviceId}>
                            <div className="flex items-center gap-2">
                              <Mic className="h-4 w-4" />
                              {mic.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {microphones.length} microphone(s) detected
                    </p>
                  </div>

                  {/* Microphone Volume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mic-volume">Microphone Volume</Label>
                      <span className="text-sm text-muted-foreground">{microphoneVolume[0]}%</span>
                    </div>
                    <Slider
                      id="mic-volume"
                      value={microphoneVolume}
                      onValueChange={handleMicrophoneVolumeChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* System Audio Volume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-volume">System Audio</Label>
                      <span className="text-sm text-muted-foreground">{systemAudioVolume[0]}%</span>
                    </div>
                    <Slider
                      id="system-volume"
                      value={systemAudioVolume}
                      onValueChange={setSystemAudioVolume}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Video Display</CardTitle>
                  <CardDescription>Aspect ratio and visual effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Background Blur */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="blur-toggle" className="font-medium">
                          Background Blur
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Blur your background for privacy
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="blur-toggle"
                      checked={backgroundBlur}
                      onCheckedChange={handleBackgroundBlurToggle}
                    />
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-2">
                    <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
                      <SelectTrigger id="aspect-ratio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">
                          <div className="flex items-center gap-2">
                            <RectangleHorizontal className="h-4 w-4" />
                            16:9 - Widescreen (Recommended)
                          </div>
                        </SelectItem>
                        <SelectItem value="4:3">
                          <div className="flex items-center gap-2">
                            <RectangleHorizontal className="h-4 w-4" />
                            4:3 - Standard
                          </div>
                        </SelectItem>
                        <SelectItem value="1:1">
                          <div className="flex items-center gap-2">
                            <RectangleHorizontal className="h-4 w-4" />
                            1:1 - Square
                          </div>
                        </SelectItem>
                        <SelectItem value="9:16">
                          <div className="flex items-center gap-2">
                            <RectangleHorizontal className="h-4 w-4 rotate-90" />
                            9:16 - Vertical (Mobile)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Changes will apply to the video feed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StreamSettingsPanel;
