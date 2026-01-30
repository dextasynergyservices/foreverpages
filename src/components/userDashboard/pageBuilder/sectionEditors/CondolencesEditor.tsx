"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, MessageSquare, Shield, FileText, ExternalLink } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";

export interface CondolenceMessage {
  id: string;
  author: string;
  message: string;
  date: string;
  approved?: boolean;
}

export interface CondolencesData {
  // Section content fields
  title?: string;
  subtitle?: string;
  // Structure fields - condolences come from public submissions
  allowPublicCondolences: boolean;
  requireApproval: boolean;
  allowLetterUpload?: boolean; // Allow visitors to upload condolence letters
  // Legacy field for backwards compatibility
  condolences?: CondolenceMessage[];
}

interface CondolencesEditorProps {
  data: CondolencesData;
  onChange: (data: CondolencesData) => void;
}

export const CondolencesEditor: React.FC<CondolencesEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Condolence Messages</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Configure how visitors can leave condolence messages
        </p>
      </div>

      {/* Info Box */}
      <div
        className={`p-4 rounded-lg border ${
          theme === "dark" ? "border-blue-500/30 bg-blue-500/10" : "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="flex gap-3">
          <MessageSquare
            className={`h-5 w-5 mt-0.5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
          />
          <div>
            <p
              className={`text-sm font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}
            >
              How Condolences Work
            </p>
            <p
              className={`text-sm mt-1 ${theme === "dark" ? "text-blue-300/80" : "text-blue-700"}`}
            >
              Visitors to the memorial page can submit condolence messages. You can review and
              approve these submissions from your{" "}
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
          <Label htmlFor="condolence-title">Section Title</Label>
          <Input
            id="condolence-title"
            placeholder="Condolences"
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="condolence-subtitle">Subtitle</Label>
          <Input
            id="condolence-subtitle"
            placeholder="Share your words of comfort and support"
            value={data.subtitle || ""}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          />
        </div>
      </div>

      {/* Settings Toggles */}
      <div className="space-y-4">
        {/* Allow Public Condolences Toggle */}
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <Heart
              className={`h-5 w-5 mt-0.5 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
            />
            <div>
              <p className="font-medium">Allow Public Condolences</p>
              <p className={`text-sm ${textMuted}`}>Let visitors submit condolence messages</p>
            </div>
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

        {/* Require Approval Toggle */}
        {data.allowPublicCondolences && (
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
                  Review condolences before they appear on the memorial
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

        {/* Allow Letter Upload Toggle */}
        {data.allowPublicCondolences && (
          <div
            className={`flex items-center justify-between p-4 rounded-lg border ${
              theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <FileText
                className={`h-5 w-5 mt-0.5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}
              />
              <div>
                <p className="font-medium">Allow Letter Uploads</p>
                <p className={`text-sm ${textMuted}`}>
                  Let visitors upload condolence letters as images or PDFs
                </p>
              </div>
            </div>
            <button
              onClick={() => onChange({ ...data, allowLetterUpload: !data.allowLetterUpload })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                data.allowLetterUpload
                  ? "bg-blue-600"
                  : theme === "dark"
                    ? "bg-white/20"
                    : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  data.allowLetterUpload ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Link */}
      <div
        className={`p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Manage Condolences</p>
            <p className={`text-sm ${textMuted}`}>
              View, approve, or decline submitted condolences
            </p>
          </div>
          <Link
            href="/user-dashboard?section=tributes"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            }`}
          >
            View Condolences
          </Link>
        </div>
      </div>
    </div>
  );
};
