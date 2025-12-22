"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Heart } from "lucide-react";

export interface Memory {
  id: string;
  title: string;
  description: string;
  date?: string;
  author: string;
  photos?: string[];
  category: "childhood" | "family" | "career" | "hobbies" | "special" | "other";
}

export interface MemoriesData {
  memories: Memory[];
  allowPublicSubmissions: boolean;
  requireApproval: boolean;
  categories: string[];
}

interface MemoriesEditorProps {
  data: MemoriesData;
  onChange: (data: MemoriesData) => void;
  onOpenMediaPicker?: () => void;
}

export const MemoriesEditor: React.FC<MemoriesEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const addMemory = () => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      title: "",
      description: "",
      author: "",
      category: "special",
      photos: [],
    };
    onChange({
      ...data,
      memories: [...data.memories, newMemory],
    });
  };

  const updateMemory = (id: string, field: keyof Memory, value: string | string[]) => {
    onChange({
      ...data,
      memories: data.memories.map((memory) =>
        memory.id === id ? { ...memory, [field]: value } : memory
      ),
    });
  };

  const removeMemory = (id: string) => {
    onChange({
      ...data,
      memories: data.memories.filter((memory) => memory.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Memories</h3>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.allowPublicSubmissions}
              onChange={(e) => onChange({ ...data, allowPublicSubmissions: e.target.checked })}
              className="mr-2"
            />
            Allow public memory submissions
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.requireApproval}
              onChange={(e) => onChange({ ...data, requireApproval: e.target.checked })}
              className="mr-2"
            />
            Require approval for submissions
          </label>
        </div>
      </div>

      {/* Memories */}
      <div className="space-y-4">
        {data.memories.map((memory) => (
          <Card key={memory.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory</CardTitle>
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
                  placeholder="Memory date"
                  value={memory.date || ""}
                  onChange={(e) => updateMemory(memory.id, "date", e.target.value)}
                />
              </div>

              <Select
                value={memory.category}
                onValueChange={(value: Memory["category"]) =>
                  updateMemory(memory.id, "category", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="childhood">Childhood</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="hobbies">Hobbies</SelectItem>
                  <SelectItem value="special">Special Moments</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Share the memory..."
                value={memory.description}
                onChange={(e) => updateMemory(memory.id, "description", e.target.value)}
                rows={4}
              />

              {onOpenMediaPicker && (
                <Button variant="outline" onClick={onOpenMediaPicker} className="w-full">
                  Add Photos to Memory
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        <Button onClick={addMemory} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Memory
        </Button>
      </div>
    </div>
  );
};
