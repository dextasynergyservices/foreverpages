"use client";

import React, { useRef, useState } from "react";
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
import { Trash2, Plus, Users, Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  description?: string;
}

export interface FamilyTreeData {
  // Section content fields
  title?: string;
  subtitle?: string;
  quote?: string;
  // Structure fields
  members: FamilyMember[];
  layout: "tree" | "list" | "timeline";
  showPhotos: boolean;
  showDates: boolean;
}

interface FamilyTreeEditorProps {
  data: FamilyTreeData;
  onChange: (data: FamilyTreeData) => void;
  onOpenMediaPicker?: () => void;
}

export const FamilyTreeEditor: React.FC<FamilyTreeEditorProps> = ({ data, onChange }) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);

  const addMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: "",
      relationship: "",
      description: "",
    };
    onChange({
      ...data,
      members: [...data.members, newMember],
    });
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    onChange({
      ...data,
      members: data.members.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      ),
    });
  };

  const removeMember = (id: string) => {
    onChange({
      ...data,
      members: data.members.filter((member) => member.id !== id),
    });
  };

  const handlePhotoUpload = async (memberId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploadingMemberId(memberId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      updateMember(memberId, "photo", result.secure_url || result.url);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingMemberId(null);
    }
  };

  const removePhoto = (memberId: string) => {
    updateMember(memberId, "photo", "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Family Tree</h3>
      </div>

      {/* Section Content */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Section Content</h4>
        <div>
          <label className="block text-sm font-medium mb-2">Section Title</label>
          <Input
            placeholder="Family Tree"
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtitle</label>
          <Input
            placeholder="A legacy of love that lives on through generations"
            value={data.subtitle || ""}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Quote (optional)</label>
          <Input
            placeholder="A family's love is life's greatest blessing"
            value={data.quote || ""}
            onChange={(e) => onChange({ ...data, quote: e.target.value })}
          />
        </div>
      </div>

      {/* Layout Options */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Layout</label>
          <Select
            value={data.layout}
            onValueChange={(value: "tree" | "list" | "timeline") =>
              onChange({ ...data, layout: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">Family Tree</SelectItem>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.showPhotos}
              onChange={(e) => onChange({ ...data, showPhotos: e.target.checked })}
              className="mr-2"
            />
            Show Photos
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.showDates}
              onChange={(e) => onChange({ ...data, showDates: e.target.checked })}
              className="mr-2"
            />
            Show Dates
          </label>
        </div>
      </div>

      {/* Family Members */}
      <div className="space-y-4">
        {data.members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Family Member</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => removeMember(member.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Full name"
                  value={member.name}
                  onChange={(e) => updateMember(member.id, "name", e.target.value)}
                />
                <Input
                  placeholder="Relationship (e.g., Son, Daughter, Spouse)"
                  value={member.relationship}
                  onChange={(e) => updateMember(member.id, "relationship", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  placeholder="Birth date"
                  value={member.birthDate || ""}
                  onChange={(e) => updateMember(member.id, "birthDate", e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="Death date (if applicable)"
                  value={member.deathDate || ""}
                  onChange={(e) => updateMember(member.id, "deathDate", e.target.value)}
                />
              </div>

              <Textarea
                placeholder="Brief description (optional)"
                value={member.description || ""}
                onChange={(e) => updateMember(member.id, "description", e.target.value)}
                rows={2}
              />

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Photo</label>
                {member.photo ? (
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={member.photo}
                        alt={member.name || "Family member"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[member.id]?.click()}
                        disabled={uploadingMemberId === member.id}
                      >
                        {uploadingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Change"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhoto(member.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRefs.current[member.id]?.click()}
                    disabled={uploadingMemberId === member.id}
                    className="w-full"
                  >
                    {uploadingMemberId === member.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                )}
                <input
                  type="file"
                  ref={(el) => {
                    fileInputRefs.current[member.id] = el;
                  }}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoUpload(member.id, file);
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addMember} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Family Member
        </Button>
      </div>
    </div>
  );
};
