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
import { Trash2, Plus, Users } from "lucide-react";

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

export const FamilyTreeEditor: React.FC<FamilyTreeEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Family Tree</h3>
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

              {onOpenMediaPicker && (
                <Button variant="outline" onClick={onOpenMediaPicker} className="w-full">
                  {member.photo ? "Change Photo" : "Add Photo"}
                </Button>
              )}
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
