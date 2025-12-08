"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  date: string;
  location?: string;
}

export interface GuestbookData {
  enabled: boolean;
  requireApproval: boolean;
  entries: GuestbookEntry[];
}

interface GuestbookEditorProps {
  data: GuestbookData;
  onChange: (data: GuestbookData) => void;
}

export const GuestbookEditor: React.FC<GuestbookEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addEntry = () => {
    const newEntry: GuestbookEntry = {
      id: `entry-${Date.now()}`,
      name: "",
      message: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
    };
    onChange({ ...data, entries: [...data.entries, newEntry] });
  };

  const updateEntry = (entryId: string, field: keyof GuestbookEntry, value: string) => {
    const updatedEntries = data.entries.map((entry) =>
      entry.id === entryId ? { ...entry, [field]: value } : entry
    );
    onChange({ ...data, entries: updatedEntries });
  };

  const removeEntry = (entryId: string) => {
    const updatedEntries = data.entries.filter((entry) => entry.id !== entryId);
    onChange({ ...data, entries: updatedEntries });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Memorial Guestbook</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>Allow visitors to sign and leave messages</p>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div>
            <p className="font-medium">Enable Guestbook</p>
            <p className={`text-sm ${textMuted}`}>Allow visitors to sign the guestbook</p>
          </div>
          <button
            onClick={() => onChange({ ...data, enabled: !data.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              data.enabled ? "bg-blue-600" : theme === "dark" ? "bg-white/20" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                data.enabled ? "left-7" : "left-1"
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
            <p className={`text-sm ${textMuted}`}>Review entries before displaying them</p>
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

      <Button onClick={addEntry} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Guestbook Entry
      </Button>

      <div className="space-y-4">
        {data.entries.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <BookOpen className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No guestbook entries yet</p>
          </div>
        ) : (
          data.entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <button
                  onClick={() => removeEntry(entry.id)}
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
                    <Label htmlFor={`entry-name-${entry.id}`}>Name *</Label>
                    <Input
                      id={`entry-name-${entry.id}`}
                      placeholder="Visitor name"
                      value={entry.name}
                      onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`entry-date-${entry.id}`}>Date</Label>
                    <Input
                      id={`entry-date-${entry.id}`}
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(entry.id, "date", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`entry-location-${entry.id}`}>Location (Optional)</Label>
                  <Input
                    id={`entry-location-${entry.id}`}
                    placeholder="City, State/Country"
                    value={entry.location || ""}
                    onChange={(e) => updateEntry(entry.id, "location", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`entry-message-${entry.id}`}>Message *</Label>
                  <Textarea
                    id={`entry-message-${entry.id}`}
                    placeholder="Guestbook message..."
                    rows={3}
                    value={entry.message}
                    onChange={(e) => updateEntry(entry.id, "message", e.target.value)}
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
