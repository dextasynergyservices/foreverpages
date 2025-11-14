"use client";

import React, { useState, useEffect } from "react";
import { StreamQuality } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
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

interface Stream {
  id: string;
  title: string;
  description: string | null;
  scheduledFor: string | null;
  quality: StreamQuality;
  hasPassword: boolean;
  enableRecording: boolean;
  enableChat: boolean;
  enableReactions: boolean;
}

interface EditStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: Stream | null;
  onSuccess: () => void;
}

const EditStreamDialog: React.FC<EditStreamDialogProps> = ({
  open,
  onOpenChange,
  stream,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledFor: "",
    quality: "FULL_HD" as StreamQuality,
    enablePassword: false,
    password: "",
    enableRecording: true,
    enableChat: true,
    enableReactions: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load stream data when dialog opens
  useEffect(() => {
    if (open && stream) {
      const scheduledDate = stream.scheduledFor
        ? new Date(stream.scheduledFor).toISOString().slice(0, 16)
        : "";

      setFormData({
        title: stream.title,
        description: stream.description || "",
        scheduledFor: scheduledDate,
        quality: stream.quality,
        enablePassword: stream.hasPassword,
        password: "",
        enableRecording: stream.enableRecording,
        enableChat: stream.enableChat,
        enableReactions: stream.enableReactions,
      });
      setErrors({});
    }
  }, [open, stream]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.scheduledFor) {
      newErrors.scheduledFor = "Scheduled time is required";
    } else {
      const scheduledDate = new Date(formData.scheduledFor);
      if (scheduledDate <= new Date()) {
        newErrors.scheduledFor = "Scheduled time must be in the future";
      }
    }

    if (formData.enablePassword && formData.password && formData.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stream || !validateForm()) return;

    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || undefined,
        scheduledFor: new Date(formData.scheduledFor).toISOString(),
        quality: formData.quality,
        enableRecording: formData.enableRecording,
        enableChat: formData.enableChat,
        enableReactions: formData.enableReactions,
      };

      // Only include password if it's being changed
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`/api/streams/${stream.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update stream");
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to update stream:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to update stream",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!stream) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Livestream</DialogTitle>
          <DialogDescription>
            Update stream details. Leave password empty to keep current password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Memorial Service Livestream"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about the service..."
              rows={3}
            />
          </div>

          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label htmlFor="edit-scheduledFor">
              Scheduled Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              className={errors.scheduledFor ? "border-destructive" : ""}
            />
            {errors.scheduledFor && (
              <p className="text-sm text-destructive">{errors.scheduledFor}</p>
            )}
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="edit-quality">Video Quality</Label>
            <Select
              value={formData.quality}
              onValueChange={(value) =>
                setFormData({ ...formData, quality: value as StreamQuality })
              }
            >
              <SelectTrigger id="edit-quality">
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
          </div>

          {/* Password Protection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-enablePassword">Password Protection</Label>
                <p className="text-sm text-muted-foreground">
                  {stream.hasPassword ? "Change stream password" : "Add password protection"}
                </p>
              </div>
              <Switch
                id="edit-enablePassword"
                checked={formData.enablePassword}
                onCheckedChange={(checked) => setFormData({ ...formData, enablePassword: checked })}
              />
            </div>

            {formData.enablePassword && (
              <div className="space-y-2 pl-4 border-l-2 border-border">
                <Label htmlFor="edit-password">
                  {stream.hasPassword ? "New Password (optional)" : "Stream Password"}
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={
                    stream.hasPassword ? "Leave empty to keep current" : "Enter password"
                  }
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
                <Label htmlFor="edit-enableRecording">Automatic Recording</Label>
                <p className="text-sm text-muted-foreground">Record stream (kept for 6 months)</p>
              </div>
              <Switch
                id="edit-enableRecording"
                checked={formData.enableRecording}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableRecording: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-enableChat">Live Chat</Label>
                <p className="text-sm text-muted-foreground">Allow viewers to post comments</p>
              </div>
              <Switch
                id="edit-enableChat"
                checked={formData.enableChat}
                onCheckedChange={(checked) => setFormData({ ...formData, enableChat: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-enableReactions">Reactions</Label>
                <p className="text-sm text-muted-foreground">
                  Allow hearts, prayers, candles, etc.
                </p>
              </div>
              <Switch
                id="edit-enableReactions"
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStreamDialog;
