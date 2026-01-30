"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";

export interface BiographyData {
  // Section content fields
  title?: string;
  quote?: string;
  quoteSource?: string;
  // Biography fields
  fullStory: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  earlyLife?: string;
  education?: string;
  career?: string;
  personalLife?: string;
  legacy?: string;
}

interface BiographyEditorProps {
  data: BiographyData;
  onChange: (data: BiographyData) => void;
  supportedFields?: string[];
}

export const BiographyEditor: React.FC<BiographyEditorProps> = ({
  data,
  onChange,
  supportedFields,
}) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const handleChange = (field: keyof BiographyData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Default to all fields if supportedFields not specified
  const fields = supportedFields || [
    "birthDate",
    "deathDate",
    "birthPlace",
    "fullStory",
    "earlyLife",
    "education",
    "career",
    "personalLife",
    "legacy",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Biography</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Tell their life story. Share the moments that defined them.
        </p>
      </div>

      {/* Section Content */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Section Content</h4>
        <div>
          <Label htmlFor="sectionTitle">Section Title</Label>
          <Input
            id="sectionTitle"
            placeholder="A Life Well Lived"
            value={data.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="quote">Quote (optional)</Label>
          <Textarea
            id="quote"
            placeholder="I have fought the good fight, I have finished the race, I have kept the faith."
            rows={2}
            value={data.quote || ""}
            onChange={(e) => handleChange("quote", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="quoteSource">Quote Source (optional)</Label>
          <Input
            id="quoteSource"
            placeholder="2 Timothy 4:7"
            value={data.quoteSource || ""}
            onChange={(e) => handleChange("quoteSource", e.target.value)}
          />
        </div>
      </div>

      {(fields.includes("birthDate") || fields.includes("deathDate")) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.includes("birthDate") && (
            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={data.birthDate || ""}
                onChange={(e) => handleChange("birthDate", e.target.value)}
              />
            </div>
          )}
          {fields.includes("deathDate") && (
            <div>
              <Label htmlFor="deathDate">Death Date</Label>
              <Input
                id="deathDate"
                type="date"
                value={data.deathDate || ""}
                onChange={(e) => handleChange("deathDate", e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {fields.includes("birthPlace") && (
        <div>
          <Label htmlFor="birthPlace">Birth Place</Label>
          <Input
            id="birthPlace"
            placeholder="City, Country"
            value={data.birthPlace || ""}
            onChange={(e) => handleChange("birthPlace", e.target.value)}
          />
        </div>
      )}

      {fields.includes("fullStory") && (
        <div>
          <Label htmlFor="fullStory">Full Life Story</Label>
          <Textarea
            id="fullStory"
            placeholder="Write their complete life story..."
            rows={6}
            value={data.fullStory}
            onChange={(e) => handleChange("fullStory", e.target.value)}
          />
          <p className={`text-xs mt-1 ${textMuted}`}>The main narrative of their life</p>
        </div>
      )}

      {fields.includes("earlyLife") && (
        <div>
          <Label htmlFor="earlyLife">Early Life</Label>
          <Textarea
            id="earlyLife"
            placeholder="Childhood, family background, formative years..."
            rows={4}
            value={data.earlyLife || ""}
            onChange={(e) => handleChange("earlyLife", e.target.value)}
          />
        </div>
      )}

      {fields.includes("education") && (
        <div>
          <Label htmlFor="education">Education</Label>
          <Textarea
            id="education"
            placeholder="Schools attended, degrees earned, academic achievements..."
            rows={3}
            value={data.education || ""}
            onChange={(e) => handleChange("education", e.target.value)}
          />
        </div>
      )}

      {fields.includes("career") && (
        <div>
          <Label htmlFor="career">Career</Label>
          <Textarea
            id="career"
            placeholder="Professional journey, accomplishments, impact..."
            rows={4}
            value={data.career || ""}
            onChange={(e) => handleChange("career", e.target.value)}
          />
        </div>
      )}

      {fields.includes("personalLife") && (
        <div>
          <Label htmlFor="personalLife">Personal Life</Label>
          <Textarea
            id="personalLife"
            placeholder="Family, hobbies, passions, personality..."
            rows={4}
            value={data.personalLife || ""}
            onChange={(e) => handleChange("personalLife", e.target.value)}
          />
        </div>
      )}

      {fields.includes("legacy") && (
        <div>
          <Label htmlFor="legacy">Legacy</Label>
          <Textarea
            id="legacy"
            placeholder="How they will be remembered, their lasting impact..."
            rows={4}
            value={data.legacy || ""}
            onChange={(e) => handleChange("legacy", e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
