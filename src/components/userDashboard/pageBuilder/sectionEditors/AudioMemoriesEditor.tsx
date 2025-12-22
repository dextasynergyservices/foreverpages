"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";
import { Trash2, Plus, Volume2 } from "lucide-react";

export interface AudioMemory {
  id: string;
  title: string;
  description?: string;
  audioUrl?: string;
  fileName?: string;
  duration?: number;
  uploadDate?: string;
  author: string;
}

export interface AudioMemoriesData {
  audioMemories: AudioMemory[];
  allowPublicUploads: boolean;
  requireApproval: boolean;
  maxFileSize: number; // in MB
  allowedFormats: string[];
}

interface AudioMemoriesEditorProps {
  data: AudioMemoriesData;
  onChange: (data: AudioMemoriesData) => void;
  onOpenMediaPicker?: () => void;
}

export const AudioMemoriesEditor: React.FC<AudioMemoriesEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const addAudioMemory = () => {
    const newMemory: AudioMemory = {
      id: Date.now().toString(),
      title: "",
      description: "",
      author: "",
      uploadDate: new Date().toISOString().split("T")[0],
    };
    onChange({
      ...data,
      audioMemories: [...data.audioMemories, newMemory],
    });
  };

  const updateMemory = (
    id: string,
    field: keyof AudioMemory,
    value: string | number | undefined
  ) => {
    onChange({
      ...data,
      audioMemories: data.audioMemories.map((memory) =>
        memory.id === id ? { ...memory, [field]: value } : memory
      ),
    });
  };

  const removeMemory = (id: string) => {
    onChange({
      ...data,
      audioMemories: data.audioMemories.filter((memory) => memory.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Volume2 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Audio Memories</h3>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Audio Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.allowPublicUploads}
                onChange={(e) => onChange({ ...data, allowPublicUploads: e.target.checked })}
                className="mr-2"
              />
              Allow public audio uploads
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.requireApproval}
                onChange={(e) => onChange({ ...data, requireApproval: e.target.checked })}
                className="mr-2"
              />
              Require approval for uploads
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={data.maxFileSize}
                onChange={(e) => onChange({ ...data, maxFileSize: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Allowed Formats</label>
              <Input
                placeholder="mp3,wav,m4a"
                value={data.allowedFormats.join(", ")}
                onChange={(e) =>
                  onChange({
                    ...data,
                    allowedFormats: e.target.value
                      .split(",")
                      .map((f) => f.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Memories */}
      <div className="space-y-4">
        {data.audioMemories.map((memory) => (
          <Card key={memory.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audio Memory</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => removeMemory(memory.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Memory title"
                value={memory.title}
                onChange={(e) => updateMemory(memory.id, "title", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Shared by"
                  value={memory.author}
                  onChange={(e) => updateMemory(memory.id, "author", e.target.value)}
                />
                <Input
                  type="date"
                  value={memory.uploadDate || ""}
                  onChange={(e) => updateMemory(memory.id, "uploadDate", e.target.value)}
                />
              </div>

              <Textarea
                placeholder="Description of the audio memory"
                value={memory.description || ""}
                onChange={(e) => updateMemory(memory.id, "description", e.target.value)}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="File name"
                  value={memory.fileName || ""}
                  onChange={(e) => updateMemory(memory.id, "fileName", e.target.value)}
                  readOnly
                />
                <Input
                  type="number"
                  placeholder="Duration (seconds)"
                  value={memory.duration || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateMemory(memory.id, "duration", val ? parseInt(val) : undefined);
                  }}
                />
              </div>

              {onOpenMediaPicker && (
                <Button variant="outline" onClick={onOpenMediaPicker} className="w-full">
                  {memory.fileName ? "Change Audio" : "Upload Audio"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        <Button onClick={addAudioMemory} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Audio Memory
        </Button>
      </div>
    </div>
  );
};
