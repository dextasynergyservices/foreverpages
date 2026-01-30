"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Shield, ExternalLink } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";

export interface TributeItem {
  id: string;
  author: string;
  relationship?: string;
  message: string;
  date: string;
}

export interface TributesData {
  // Section content fields
  title?: string;
  subtitle?: string;
  // Structure fields - removed manual tributes array since tributes come from public
  allowPublicTributes?: boolean;
  requireApproval?: boolean;
  showVirtualOfferings?: boolean; // Show candle/flower offerings
  // Legacy field for backwards compatibility
  tributes?: TributeItem[];
}

interface TributesEditorProps {
  data: TributesData;
  onChange: (data: TributesData) => void;
}

export const TributesEditor: React.FC<TributesEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tributes & Memories</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Configure how visitors can leave tributes on the memorial page
        </p>
      </div>

      {/* Info Box */}
      <div
        className={`p-4 rounded-lg border ${
          theme === "dark" ? "border-blue-500/30 bg-blue-500/10" : "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="flex gap-3">
          <MessageCircle
            className={`h-5 w-5 mt-0.5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
          />
          <div>
            <p
              className={`text-sm font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}
            >
              How Tributes Work
            </p>
            <p
              className={`text-sm mt-1 ${theme === "dark" ? "text-blue-300/80" : "text-blue-700"}`}
            >
              Visitors to the memorial page can submit their own tributes and memories. You can
              review, approve, or decline these submissions from your{" "}
              <Link
                href="/user-dashboard?section=tributes"
                className="underline hover:no-underline inline-flex items-center gap-1"
              >
                Tributes Dashboard
                <ExternalLink className="h-3 w-3" />
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div
        className={`space-y-4 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}
      >
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Section Content</h4>
        <div>
          <Label htmlFor="tribute-title">Section Title</Label>
          <Input
            id="tribute-title"
            placeholder="Tributes & Memories"
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="tribute-subtitle">Subtitle</Label>
          <Input
            id="tribute-subtitle"
            placeholder="Share your memories and love"
            value={data.subtitle || ""}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          />
        </div>
      </div>

      {/* Settings Toggles */}
      <div className="space-y-4">
        {/* Allow Public Tributes Toggle */}
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <Heart
              className={`h-5 w-5 mt-0.5 ${theme === "dark" ? "text-pink-400" : "text-pink-600"}`}
            />
            <div>
              <p className="font-medium">Allow Public Tributes</p>
              <p className={`text-sm ${textMuted}`}>Let visitors submit tributes and memories</p>
            </div>
          </div>
          <button
            onClick={() => onChange({ ...data, allowPublicTributes: !data.allowPublicTributes })}
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

        {/* Require Approval Toggle */}
        {data.allowPublicTributes && (
          <div
            className={`flex items-center justify-between p-4 rounded-lg border ${
              theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <Shield
                className={`h-5 w-5 mt-0.5 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
              />
              <div>
                <p className="font-medium">Require Approval</p>
                <p className={`text-sm ${textMuted}`}>
                  Review tributes before they appear on the memorial
                </p>
              </div>
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
        )}

        {/* Show Virtual Offerings Toggle */}
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">🕯️</span>
            <div>
              <p className="font-medium">Show Virtual Offerings</p>
              <p className={`text-sm ${textMuted}`}>
                Allow visitors to light candles, send flowers, and hearts
              </p>
            </div>
          </div>
          <button
            onClick={() => onChange({ ...data, showVirtualOfferings: !data.showVirtualOfferings })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              data.showVirtualOfferings
                ? "bg-blue-600"
                : theme === "dark"
                  ? "bg-white/20"
                  : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                data.showVirtualOfferings ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dashboard Link */}
      <div
        className={`p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Manage Tributes</p>
            <p className={`text-sm ${textMuted}`}>View, approve, or decline submitted tributes</p>
          </div>
          <Link
            href="/user-dashboard?section=tributes"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            }`}
          >
            View Tributes
          </Link>
        </div>
      </div>
    </div>
  );
};
