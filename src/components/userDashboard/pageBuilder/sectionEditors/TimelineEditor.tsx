"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
}

interface TimelineEditorProps {
  data: TimelineData;
  onChange: (data: TimelineData) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addEvent = () => {
    const newEvent: TimelineEvent = {
      id: `event-${Date.now()}`,
      date: "",
      title: "",
      description: "",
    };
    onChange({ events: [...data.events, newEvent] });
  };

  const updateEvent = (eventId: string, field: keyof TimelineEvent, value: string) => {
    const updatedEvents = data.events.map((event) =>
      event.id === eventId ? { ...event, [field]: value } : event
    );
    onChange({ events: updatedEvents });
  };

  const removeEvent = (eventId: string) => {
    const updatedEvents = data.events.filter((event) => event.id !== eventId);
    onChange({ events: updatedEvents });
  };

  const sortedEvents = [...data.events].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Life Timeline</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Chronicle the milestones and memorable moments of their life
        </p>
      </div>

      <Button onClick={addEvent} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Timeline Event
      </Button>

      <div className="space-y-6">
        {sortedEvents.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Calendar className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No timeline events added yet</p>
            <p className={`text-xs mt-1 ${textMuted}`}>
              Click the button above to add life milestones
            </p>
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <div
              key={event.id}
              className={`relative p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      theme === "dark"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-sm font-medium ${textMuted}`}>Event {index + 1}</span>
                </div>
                <button
                  onClick={() => removeEvent(event.id)}
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
                <div>
                  <Label htmlFor={`event-date-${event.id}`}>Date</Label>
                  <Input
                    id={`event-date-${event.id}`}
                    type="date"
                    value={event.date}
                    onChange={(e) => updateEvent(event.id, "date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`event-title-${event.id}`}>Title *</Label>
                  <Input
                    id={`event-title-${event.id}`}
                    placeholder="e.g., Graduated from University"
                    value={event.title}
                    onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`event-description-${event.id}`}>Description (Optional)</Label>
                  <Textarea
                    id={`event-description-${event.id}`}
                    placeholder="Share more details about this moment..."
                    rows={3}
                    value={event.description || ""}
                    onChange={(e) => updateEvent(event.id, "description", e.target.value)}
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
