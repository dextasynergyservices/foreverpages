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
  const [iframeLoaded, setIframeLoaded] = useState(false);

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

  // Determine preview URL based on template type and status
  const getPreviewUrl = () => {
    if (!template) return null;

    // Next.js templates (isNextJsTemplate flag or previewMode === NATIVE)
    const isNextJs =
      (template as { isNextJsTemplate?: boolean }).isNextJsTemplate === true ||
      template.componentPath?.startsWith("templates/");

    if (isNextJs) {
      // Check if template is published (PR merged and active)
      const isPublished = template.processingStatus === "PUBLISHED" && template.isAvailable;

      if (isPublished) {
        // Direct Next.js page access
        return `/templates/${template.slug}?preview=true`;
      } else {
        // Template not yet merged - show PR link or "pending" message
        return null;
      }
    }

    // Legacy React SPA templates - use artifact route
    return `/templates/preview/${template.id}`;
  };

  useEffect(() => {
    if (isOpen && templateId) {
      setIframeLoaded(false);
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

          {template &&
            !loading &&
            !error &&
            (() => {
              const previewUrl = getPreviewUrl();
              const isNextJs =
                (template as { isNextJsTemplate?: boolean }).isNextJsTemplate === true ||
                template.componentPath?.startsWith("templates/");
              const isPending = isNextJs && !previewUrl;
              const prUrl = (template as { prUrl?: string }).prUrl;

              return (
                <div className="space-y-6">
                  {/* Pending Template Notice (Next.js templates awaiting PR merge) */}
                  {isPending && (
                    <div className="rounded-lg border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-800">
                            <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                            Template Pending Review
                          </h3>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                            This Next.js template has been uploaded and is awaiting code review. The
                            template will be available for preview after the Pull Request is
                            reviewed and merged.
                          </p>
                          {prUrl && (
                            <a
                              href={prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                              View Pull Request
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Template Preview - Embedded iframe for quick preview */}
                  {!isPending && (
                    <div className="space-y-4">
                      {/* Live Preview Label */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          Live Preview
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isNextJs
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            }`}
                          >
                            {isNextJs ? "Next.js Template" : "React SPA"}
                          </span>
                        </div>
                      </div>

                      {/* Iframe Preview Container */}
                      <div className="relative rounded-lg overflow-hidden bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 shadow-xl">
                        <div className="relative w-full h-[600px]">
                          <iframe
                            src={previewUrl || `/templates/preview/${template.id}`}
                            className="w-full h-full border-0"
                            title={`${template.name} Preview`}
                            loading="lazy"
                            onLoad={() => setIframeLoaded(true)}
                          />
                          {/* Loading overlay - only show while loading */}
                          {!iframeLoaded && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center pointer-events-none">
                              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Open in New Tab - Overlay Button */}
                        <div className="absolute inset-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group flex items-end justify-center pb-6 pointer-events-none">
                          <a
                            href={previewUrl || `/templates/preview/${template.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            Open in Full Screen
                          </a>
                        </div>
                      </div>

                      {/* Quick Actions Below Preview */}
                      <div className="flex items-center justify-between pt-2">
                        <p className={`text-sm ${textMuted}`}>
                          Hover over preview to open in new tab for detailed exploration
                        </p>
                        <a
                          href={previewUrl || `/templates/preview/${template.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Open in New Tab
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}

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
                          theme === "dark"
                            ? "bg-white/5 text-white/70"
                            : "bg-gray-100 text-gray-600"
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
                        This template is not available in your current plan. Please upgrade to use
                        this template.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
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
