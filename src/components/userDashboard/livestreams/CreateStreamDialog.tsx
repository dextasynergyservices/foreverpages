"use client";

import React, { useState, useEffect } from "react";
import { StreamQuality } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface CreateStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memorialId: string;
  onSuccess: () => void;
}

const CreateStreamDialog: React.FC<CreateStreamDialogProps> = ({
  open,
  onOpenChange,
  memorialId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startImmediately: true,
    scheduledFor: "",
    quality: "FULL_HD" as StreamQuality,
    enablePassword: false,
    password: "",
    enableRecording: true,
    enableChat: true,
    enableReactions: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        startImmediately: true,
        scheduledFor: "",
        quality: "FULL_HD",
        enablePassword: false,
        password: "",
        enableRecording: true,
        enableChat: true,
        enableReactions: true,
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // Only validate scheduledFor if not starting immediately
    if (!formData.startImmediately) {
      if (!formData.scheduledFor) {
        newErrors.scheduledFor = "Scheduled time is required";
      } else {
        const scheduledDate = new Date(formData.scheduledFor);
        if (scheduledDate <= new Date()) {
          newErrors.scheduledFor = "Scheduled time must be in the future";
        }
      }
    }

    if (formData.enablePassword && !formData.password.trim()) {
      newErrors.password = "Password is required when password protection is enabled";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        memorialId,
        title: formData.title,
        description: formData.description || undefined,
        scheduledFor: formData.startImmediately
          ? undefined
          : new Date(formData.scheduledFor).toISOString(),
        quality: formData.quality,
        password: formData.enablePassword ? formData.password : undefined,
        enableRecording: formData.enableRecording,
        enableChat: formData.enableChat,
        enableReactions: formData.enableReactions,
        startImmediately: formData.startImmediately,
      };

      const response = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stream");
      }

      const result = await response.json();

      // If starting immediately, navigate to broadcaster page
      if (formData.startImmediately && result.stream?.id) {
        toast.success("Stream created! Starting broadcast...");

        // Start the stream first
        const startResponse = await fetch(`/api/streams/${result.stream.id}/start`, {
          method: "POST",
        });

        if (startResponse.ok) {
          window.location.href = `/stream/broadcast/${result.stream.id}`;
          return;
        } else {
          toast.error("Failed to start stream. You can start it manually from the dashboard.");
        }
      } else {
        // Show success message for scheduled streams
        toast.success(
          "Stream scheduled successfully! Click the START button when you're ready to begin broadcasting.",
          { duration: 5000 }
        );
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to create stream:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to create stream",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Livestream</DialogTitle>
          <DialogDescription>
            Start broadcasting immediately or schedule for later. All streams are recorded by
            default.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Memorial Service Livestream"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about the service..."
              rows={3}
            />
          </div>

          {/* Start Immediately Option */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="startImmediately">Start Immediately</Label>
                <p className="text-sm text-muted-foreground">
                  Begin broadcasting right after creation
                </p>
              </div>
              <Switch
                id="startImmediately"
                checked={formData.startImmediately}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, startImmediately: checked })
                }
              />
            </div>

            {/* Scheduled Time - Only show if not starting immediately */}
            {!formData.startImmediately && (
              <div className="space-y-2 pl-4 border-l-2 border-border">
                <Label htmlFor="scheduledFor">
                  Scheduled Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className={errors.scheduledFor ? "border-destructive" : ""}
                />
                {errors.scheduledFor && (
                  <p className="text-sm text-destructive">{errors.scheduledFor}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Schedule the stream for a future date and time
                </p>
              </div>
            )}
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="quality">Video Quality</Label>
            <Select
              value={formData.quality}
              onValueChange={(value) =>
                setFormData({ ...formData, quality: value as StreamQuality })
              }
            >
              <SelectTrigger id="quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOWEST">144p - Lowest (Data Saver)</SelectItem>
                <SelectItem value="LOW">240p - Low</SelectItem>
                <SelectItem value="MEDIUM">360p - Medium</SelectItem>
                <SelectItem value="HIGH">480p - High</SelectItem>
                <SelectItem value="HD">720p - HD</SelectItem>
                <SelectItem value="FULL_HD">1080p - Full HD (Recommended)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default quality is 1080p. Viewers can adjust based on their connection.
            </p>
          </div>

          {/* Password Protection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enablePassword">Password Protection</Label>
                <p className="text-sm text-muted-foreground">Require password to view stream</p>
              </div>
              <Switch
                id="enablePassword"
                checked={formData.enablePassword}
                onCheckedChange={(checked) => setFormData({ ...formData, enablePassword: checked })}
              />
            </div>

            {formData.enablePassword && (
              <div className="space-y-2 pl-4 border-l-2 border-border">
                <Label htmlFor="password">
                  Stream Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-3 border-t pt-4">
            <Label>Stream Features</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableRecording">Automatic Recording</Label>
                <p className="text-sm text-muted-foreground">Record stream (kept for 6 months)</p>
              </div>
              <Switch
                id="enableRecording"
                checked={formData.enableRecording}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableRecording: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableChat">Live Chat</Label>
                <p className="text-sm text-muted-foreground">Allow viewers to post comments</p>
              </div>
              <Switch
                id="enableChat"
                checked={formData.enableChat}
                onCheckedChange={(checked) => setFormData({ ...formData, enableChat: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableReactions">Reactions</Label>
                <p className="text-sm text-muted-foreground">
                  Allow hearts, prayers, candles, etc.
                </p>
              </div>
              <Switch
                id="enableReactions"
                checked={formData.enableReactions}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableReactions: checked })
                }
              />
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Stream
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStreamDialog;
