"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Circle, Square, Pause, Play, Download } from "lucide-react";
import { RecordingQuality } from "@/hooks/useMediaRecorder";
import toast from "react-hot-toast";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  quality: RecordingQuality;
  autoDownload: boolean;
  onQualityChange: (quality: RecordingQuality) => void;
  onAutoDownloadChange: (enabled: boolean) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  disabled?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  quality,
  autoDownload,
  onQualityChange,
  onAutoDownloadChange,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    setIsProcessing(true);
    try {
      await onStartRecording();
      toast.success("Recording started");
    } catch {
      toast.error("Failed to start recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    try {
      await onStopRecording();
      toast.success("Recording stopped");
    } catch {
      toast.error("Failed to stop recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePause = () => {
    onPauseRecording();
    toast("Recording paused");
  };

  const handleResume = () => {
    onResumeRecording();
    toast("Recording resumed");
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Circle className="h-5 w-5 text-red-500" />
          Recording Controls
        </CardTitle>
        <CardDescription>Manage stream recording settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Quality */}
        <div className="space-y-2">
          <Label htmlFor="recording-quality" className="text-gray-300">
            Recording Quality
          </Label>
          <Select
            value={quality}
            onValueChange={(value) => onQualityChange(value as RecordingQuality)}
            disabled={isRecording || disabled}
          >
            <SelectTrigger
              id="recording-quality"
              className="bg-gray-800 border-gray-700 text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="low" className="text-white hover:bg-gray-700">
                Low (500 kbps) - Smallest file size
              </SelectItem>
              <SelectItem value="medium" className="text-white hover:bg-gray-700">
                Medium (1.5 Mbps) - Balanced
              </SelectItem>
              <SelectItem value="high" className="text-white hover:bg-gray-700">
                High (3 Mbps) - Recommended
              </SelectItem>
              <SelectItem value="ultra" className="text-white hover:bg-gray-700">
                Ultra (6 Mbps) - Best quality
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">
            {isRecording
              ? "Quality cannot be changed during recording"
              : "Higher quality = larger file size"}
          </p>
        </div>

        {/* Auto-Download Toggle */}
        <div className="flex items-center justify-between space-x-2 bg-gray-800/50 rounded-lg p-3">
          <div className="space-y-0.5">
            <Label htmlFor="auto-download" className="text-gray-300 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Auto-Download
            </Label>
            <p className="text-xs text-gray-400">Save recording locally while streaming</p>
          </div>
          <Switch
            id="auto-download"
            checked={autoDownload}
            onCheckedChange={onAutoDownloadChange}
            disabled={isRecording || disabled}
          />
        </div>

        {/* Recording Actions */}
        <div className="space-y-2 pt-2">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={disabled || isProcessing}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Circle className="h-4 w-4 mr-2 fill-current" />
              Start Recording
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {isPaused ? (
                  <Button
                    onClick={handleResume}
                    disabled={disabled || isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    disabled={disabled || isProcessing}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={handleStopRecording}
                  disabled={disabled || isProcessing}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        {isRecording && (
          <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-2">
            💡 Recording will be automatically uploaded when you stop the stream.
            {autoDownload && " A local copy will also be saved to your device."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecordingControls;
