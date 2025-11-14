"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, CameraOff, Mic, MicOff, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaPreviewProps {
  localStream: MediaStream | null;
  setLocalStream: (stream: MediaStream | null) => void;
  isMediaReady: boolean;
  setIsMediaReady: (ready: boolean) => void;
  onError: (error: string) => void;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  localStream,
  setLocalStream,
  isMediaReady,
  setIsMediaReady,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Device lists
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  // Enumerate devices
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoInputs = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        }));

      const audioInputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
        }));

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
    }
  };

  // Initialize media
  const initializeMedia = async () => {
    try {
      setLoading(true);
      onError("");

      const constraints: MediaStreamConstraints = {
        video: selectedVideoDevice
          ? { deviceId: { exact: selectedVideoDevice } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: selectedAudioDevice
          ? { deviceId: { exact: selectedAudioDevice } }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop existing tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      setLocalStream(stream);
      setIsMediaReady(true);

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate devices after getting permissions
      await enumerateDevices();
    } catch (error) {
      console.error("Failed to get user media:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to access camera/microphone. Please check permissions.";
      onError(errorMessage);
      setIsMediaReady(false);
    } finally {
      setLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change devices
  useEffect(() => {
    if (isMediaReady && (selectedVideoDevice || selectedAudioDevice)) {
      initializeMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoDevice, selectedAudioDevice]);

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
      <CardContent className="p-0">
        {/* Video Preview */}
        <div className="relative aspect-video bg-gray-950">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* Overlay when video is off */}
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <CameraOff className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">Camera is off</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p className="text-gray-300">Initializing media...</p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {isMediaReady && (
            <div className="absolute top-4 left-4">
              <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Preview
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="flex items-center justify-between">
            {/* Media Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={videoEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
                disabled={!isMediaReady}
              >
                {videoEnabled ? (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Camera On
                  </>
                ) : (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Camera Off
                  </>
                )}
              </Button>

              <Button
                variant={audioEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleAudio}
                disabled={!isMediaReady}
              >
                {audioEnabled ? (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Mic On
                  </>
                ) : (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Mic Off
                  </>
                )}
              </Button>
            </div>

            {/* Device Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Devices
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Camera</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Microphone</DropdownMenuLabel>
                <div className="px-2 py-2">
                  <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaPreview;
