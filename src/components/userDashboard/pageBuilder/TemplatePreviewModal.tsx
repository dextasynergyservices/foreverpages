"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, Lock, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import toast from "react-hot-toast";

interface TemplatePreviewData {
  id: string;
  name: string;
  slug: string;
  description: string;
  previewImage: string | null;
  thumbnailImage: string | null;
  supportedSections: string[];
  layoutType: string;
  defaultConfig: Record<string, unknown> | null;
  category: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  plans: Array<{
    id: string;
    name: string;
    slug: string;
    priceNGN: number | null;
    priceUSD: number | null;
  }>;
  isAvailable: boolean;
  isPremium: boolean;
  componentPath: string | null;
  artifactAssets: Record<string, string> | null;
  processingStatus: string;
}

interface TemplatePreviewModalProps {
  templateId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  disabled?: boolean;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  templateId,
  isOpen,
  onClose,
  onSelectTemplate,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [template, setTemplate] = useState<TemplatePreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplatePreview = async () => {
    if (!templateId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${templateId}/preview`);

      if (!response.ok) {
        throw new Error("Failed to load template preview");
      }

      const data = await response.json();
      setTemplate(data.data);
    } catch (err) {
      console.error("Error fetching template preview:", err);
      setError(err instanceof Error ? err.message : "Failed to load template");
      toast.error("Failed to load template preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && templateId) {
      fetchTemplatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, templateId]);

  const handleSelectTemplate = () => {
    if (template && !disabled && template.isAvailable) {
      onSelectTemplate(template.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const borderColor = theme === "dark" ? "border-white/10" : "border-gray-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${cardBg} ${borderColor} border`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 ${cardBg} border-b ${borderColor}`}
        >
          <h2 className="text-2xl font-serif font-semibold">
            {loading ? "Loading..." : template?.name || "Template Preview"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className={textMuted}>Loading template preview...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 mb-4">
                <X className="h-12 w-12" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
              <button
                onClick={fetchTemplatePreview}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {template && !loading && !error && (
            <div className="space-y-6">
              {/* Template Preview - Always show live template in iframe */}
              <div className="relative rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
                <div className="relative w-full h-[600px]">
                  <iframe
                    src={`/templates/preview/${template.id}`}
                    className="w-full h-full border-0"
                    title={`${template.name} Preview`}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    style={{ backgroundColor: "white" }}
                  />
                  {/* Live Preview Label */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-600/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 z-10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Live Preview
                  </div>
                </div>
              </div>

              {/* Availability Badge */}
              <div className="flex items-center gap-2">
                {template.isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Available in Your Plan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    {template.isPremium ? "Premium Plan Required" : "Not Available"}
                  </span>
                )}
                {template.category && (
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      theme === "dark" ? "bg-white/5 text-white/70" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {template.category.name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className={textMuted}>{template.description}</p>
              </div>

              {/* Supported Sections */}
              {template.supportedSections && template.supportedSections.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Included Sections</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {template.supportedSections.map((section, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          theme === "dark" ? "bg-white/5" : "bg-gray-50"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-medium capitalize">
                          {section.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layout Type */}
              {template.layoutType && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Layout Type</h3>
                  <p className={`capitalize ${textMuted}`}>
                    {template.layoutType.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                </div>
              )}

              {/* Plans */}
              {template.plans && template.plans.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Available In</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.plans.map((plan) => {
                      const isPaidPlan =
                        (plan.priceNGN && Number(plan.priceNGN) > 0) ||
                        (plan.priceUSD && Number(plan.priceUSD) > 0);
                      return (
                        <span
                          key={plan.id}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isPaidPlan
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {plan.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warning if disabled */}
              {disabled && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    You already have an active template. Please delete it before selecting a new
                    one.
                  </p>
                </div>
              )}

              {/* Warning if not available */}
              {!template.isAvailable && !disabled && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    This template is not available in your current plan. Please upgrade to use this
                    template.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {template && !loading && !error && (
          <div
            className={`sticky bottom-0 flex items-center justify-end gap-3 p-6 ${cardBg} border-t ${borderColor}`}
          >
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === "dark" ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSelectTemplate}
              disabled={disabled || !template.isAvailable}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                disabled || !template.isAvailable
                  ? "bg-gray-400 dark:bg-gray-600 text-gray-300 dark:text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Use This Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
