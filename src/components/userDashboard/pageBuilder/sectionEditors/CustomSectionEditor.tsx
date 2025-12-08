"use client";

import React from "react";
import { Textarea } from "@/components/ui/textArea";
import { useTheme } from "@/hooks/useTheme";

export interface CustomSectionData {
  content?: string;
}

interface CustomSectionEditorProps {
  data: CustomSectionData;
  onChange: (data: CustomSectionData) => void;
}

export const CustomSectionEditor: React.FC<CustomSectionEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Custom Section</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>Add any custom content in Markdown format</p>
      </div>

      <div>
        <Textarea
          placeholder="Write your custom content here using Markdown formatting..."
          rows={15}
          value={data.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
        />
        <p className={`text-xs mt-2 ${textMuted}`}>
          Supports Markdown: **bold**, *italic*, [links](url), etc.
        </p>
      </div>

      <div
        className={`p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <h4 className="font-medium mb-2">Markdown Quick Reference:</h4>
        <ul className={`text-sm space-y-1 ${textMuted}`}>
          <li>• **bold text** or __bold text__</li>
          <li>• *italic text* or _italic text_</li>
          <li>• # Heading 1, ## Heading 2, ### Heading 3</li>
          <li>• [Link text](https://url.com)</li>
          <li>• ![Image alt](https://image-url.com)</li>
          <li>• - List item or * List item</li>
          <li>• &gt; Blockquote</li>
        </ul>
      </div>
    </div>
  );
};
