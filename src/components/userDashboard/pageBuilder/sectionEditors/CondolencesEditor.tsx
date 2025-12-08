"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Heart } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface CondolenceMessage {
  id: string;
  author: string;
  message: string;
  date: string;
  approved?: boolean;
}

export interface CondolencesData {
  allowPublicCondolences: boolean;
  requireApproval: boolean;
  condolences: CondolenceMessage[];
}

interface CondolencesEditorProps {
  data: CondolencesData;
  onChange: (data: CondolencesData) => void;
}

export const CondolencesEditor: React.FC<CondolencesEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addCondolence = () => {
    const newCondolence: CondolenceMessage = {
      id: `condolence-${Date.now()}`,
      author: "",
      message: "",
      date: new Date().toISOString().split("T")[0],
      approved: true,
    };
    onChange({ ...data, condolences: [...data.condolences, newCondolence] });
  };

  const updateCondolence = (
    condolenceId: string,
    field: keyof CondolenceMessage,
    value: string | boolean
  ) => {
    const updatedCondolences = data.condolences.map((condolence) =>
      condolence.id === condolenceId ? { ...condolence, [field]: value } : condolence
    );
    onChange({ ...data, condolences: updatedCondolences });
  };

  const removeCondolence = (condolenceId: string) => {
    const updatedCondolences = data.condolences.filter((c) => c.id !== condolenceId);
    onChange({ ...data, condolences: updatedCondolences });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Condolence Messages</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Allow visitors to share their condolences and sympathy
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div>
            <p className="font-medium">Allow Public Condolences</p>
            <p className={`text-sm ${textMuted}`}>Let visitors leave condolence messages</p>
          </div>
          <button
            onClick={() =>
              onChange({ ...data, allowPublicCondolences: !data.allowPublicCondolences })
            }
            className={`relative w-12 h-6 rounded-full transition-colors ${
              data.allowPublicCondolences
                ? "bg-blue-600"
                : theme === "dark"
                  ? "bg-white/20"
                  : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                data.allowPublicCondolences ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div>
            <p className="font-medium">Require Approval</p>
            <p className={`text-sm ${textMuted}`}>Review messages before displaying them</p>
          </div>
          <button
            onClick={() => onChange({ ...data, requireApproval: !data.requireApproval })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              data.requireApproval
                ? "bg-blue-600"
                : theme === "dark"
                  ? "bg-white/20"
                  : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                data.requireApproval ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Add Condolence Button */}
      <Button onClick={addCondolence} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Condolence Message
      </Button>

      {/* Condolences List */}
      <div className="space-y-4">
        {data.condolences.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Heart className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No condolence messages yet</p>
          </div>
        ) : (
          data.condolences.map((condolence) => (
            <div
              key={condolence.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Heart className="h-5 w-5 text-red-500" />
                <button
                  onClick={() => removeCondolence(condolence.id)}
                  className={`p-2 rounded-md transition-colors ${
                    theme === "dark"
                      ? "hover:bg-red-500/20 text-red-400"
                      : "hover:bg-red-100 text-red-600"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`condolence-author-${condolence.id}`}>Author Name *</Label>
                    <Input
                      id={`condolence-author-${condolence.id}`}
                      placeholder="Name"
                      value={condolence.author}
                      onChange={(e) => updateCondolence(condolence.id, "author", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`condolence-date-${condolence.id}`}>Date</Label>
                    <Input
                      id={`condolence-date-${condolence.id}`}
                      type="date"
                      value={condolence.date}
                      onChange={(e) => updateCondolence(condolence.id, "date", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`condolence-message-${condolence.id}`}>Message *</Label>
                  <Textarea
                    id={`condolence-message-${condolence.id}`}
                    placeholder="Condolence message..."
                    rows={4}
                    value={condolence.message}
                    onChange={(e) => updateCondolence(condolence.id, "message", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
