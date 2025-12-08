import React, { useEffect, useState } from "react";
import { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { getTemplateComponent, TemplateProps } from "@/lib/templates/registry";
import { loadTemplateBySlug, ensureTemplateRegistered } from "@/lib/templates/dynamic-loader";
import { applyDesignTokensToElement } from "@/lib/utils/designTokensUtils";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";
// Import templates to ensure registration
import "@/lib/templates";

interface TemplateRendererProps {
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  memorial: Memorial;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ userTemplate, memorial }) => {
  const [TemplateComponent, setTemplateComponent] =
    useState<React.ComponentType<TemplateProps> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const slug = userTemplate.baseTemplate.slug;

        // First, check if already registered
        const component = getTemplateComponent(slug);

        if (component) {
          setTemplateComponent(() => component.MemorialTemplate);
        } else {
          // Try to dynamically load and register the template
          console.log(`Dynamically loading template: ${slug}`);
          const registered = await ensureTemplateRegistered(slug);

          if (registered) {
            const registeredComponent = getTemplateComponent(slug);
            if (registeredComponent) {
              setTemplateComponent(() => registeredComponent.MemorialTemplate);
            } else {
              throw new Error(`Template registered but component not found: ${slug}`);
            }
          } else {
            // Last resort: try direct dynamic import
            console.log(`Attempting direct import for template: ${slug}`);
            const TemplateModule = await loadTemplateBySlug(slug);
            if (TemplateModule) {
              setTemplateComponent(() => TemplateModule);
            } else {
              throw new Error(`No component found for template: ${slug}`);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load template:", err);
        setError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [userTemplate.baseTemplate.slug]);

  // Load and apply design tokens from UserTemplate config
  useEffect(() => {
    if (userTemplate.config) {
      try {
        // Parse config as DesignTokens, handling the JsonValue type
        const config = userTemplate.config as unknown;
        if (config && typeof config === "object") {
          applyDesignTokensToElement(document.documentElement, config as DesignTokens);
        }
      } catch (err) {
        console.error("Failed to apply design tokens:", err);
      }
    }
  }, [userTemplate.config]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Template Error</h1>
          <p className="text-gray-600">{error || "Template component not found"}</p>
          <p className="text-sm text-gray-500 mt-2">
            Template: {userTemplate.baseTemplate.name} ({userTemplate.baseTemplate.slug})
          </p>
        </div>
      </div>
    );
  }

  return <TemplateComponent memorial={memorial} userTemplate={userTemplate} />;
};
