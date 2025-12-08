"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Heart } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface TributeItem {
  id: string;
  author: string;
  relationship?: string;
  message: string;
  date: string;
}

export interface TributesData {
  tributes: TributeItem[];
  allowPublicTributes?: boolean;
}

interface TributesEditorProps {
  data: TributesData;
  onChange: (data: TributesData) => void;
}

export const TributesEditor: React.FC<TributesEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addTribute = () => {
    const newTribute: TributeItem = {
      id: `tribute-${Date.now()}`,
      author: "",
      relationship: "",
      message: "",
      date: new Date().toISOString().split("T")[0],
    };
    onChange({ ...data, tributes: [...data.tributes, newTribute] });
  };

  const updateTribute = (tributeId: string, field: keyof TributeItem, value: string) => {
    const updatedTributes = data.tributes.map((tribute) =>
      tribute.id === tributeId ? { ...tribute, [field]: value } : tribute
    );
    onChange({ ...data, tributes: updatedTributes });
  };

  const removeTribute = (tributeId: string) => {
    const updatedTributes = data.tributes.filter((tribute) => tribute.id !== tributeId);
    onChange({ ...data, tributes: updatedTributes });
  };

  const togglePublicTributes = () => {
    onChange({ ...data, allowPublicTributes: !data.allowPublicTributes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tributes & Memories</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Share heartfelt tributes and cherished memories
        </p>
      </div>

      {/* Allow Public Tributes Toggle */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div>
          <p className="font-medium">Allow Public Tributes</p>
          <p className={`text-sm ${textMuted}`}>Let visitors leave their own tributes</p>
        </div>
        <button
          onClick={togglePublicTributes}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            data.allowPublicTributes
              ? "bg-blue-600"
              : theme === "dark"
                ? "bg-white/20"
                : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              data.allowPublicTributes ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      <Button onClick={addTribute} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Tribute
      </Button>

      <div className="space-y-4">
        {data.tributes.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Heart className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No tributes added yet</p>
            <p className={`text-xs mt-1 ${textMuted}`}>Add tributes from family and friends</p>
          </div>
        ) : (
          data.tributes.map((tribute) => (
            <div
              key={tribute.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Heart
                  className={`h-5 w-5 ${theme === "dark" ? "text-pink-400" : "text-pink-600"}`}
                />
                <button
                  onClick={() => removeTribute(tribute.id)}
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
                    <Label htmlFor={`tribute-author-${tribute.id}`}>Author Name *</Label>
                    <input
                      id={`tribute-author-${tribute.id}`}
                      type="text"
                      placeholder="Full name"
                      value={tribute.author}
                      onChange={(e) => updateTribute(tribute.id, "author", e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-md border ${
                        theme === "dark"
                          ? "bg-black border-white/10 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`tribute-relationship-${tribute.id}`}>
                      Relationship (Optional)
                    </Label>
                    <input
                      id={`tribute-relationship-${tribute.id}`}
                      type="text"
                      placeholder="e.g., Sister, Friend, Colleague"
                      value={tribute.relationship || ""}
                      onChange={(e) => updateTribute(tribute.id, "relationship", e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-md border ${
                        theme === "dark"
                          ? "bg-black border-white/10 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`tribute-message-${tribute.id}`}>Tribute Message *</Label>
                  <Textarea
                    id={`tribute-message-${tribute.id}`}
                    placeholder="Share your memories and feelings..."
                    rows={4}
                    value={tribute.message}
                    onChange={(e) => updateTribute(tribute.id, "message", e.target.value)}
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
