import React, { useEffect, useState } from "react";
import { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { getTemplateComponent, TemplateProps } from "@/lib/templates/registry";
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
        const component = getTemplateComponent(userTemplate.baseTemplate.slug);

        if (component) {
          setTemplateComponent(() => component.MemorialTemplate);
        } else {
          // Fallback: try dynamic import
          const templatePath = userTemplate.baseTemplate.componentPath;
          if (templatePath) {
            const templateModule = await import(
              `@/components/templates/components/${templatePath}`
            );
            setTemplateComponent(() => templateModule.default || templateModule.MemorialTemplate);
          } else {
            throw new Error(`No component found for template: ${userTemplate.baseTemplate.slug}`);
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
  }, [userTemplate.baseTemplate.slug, userTemplate.baseTemplate.componentPath]);

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
