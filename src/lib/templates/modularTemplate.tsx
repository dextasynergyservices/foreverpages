import React from "react";
import { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { TemplateThemeProvider, TemplateTheme } from "@/contexts/TemplateThemeContext";
import { sectionRegistry } from "./sectionRegistry";

export interface ModularTemplateProps {
  memorial: Memorial;
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
}

export interface TemplateModule {
  id: string;
  component: React.ComponentType<{ memorial: Memorial; config?: Record<string, unknown> }>;
  defaultConfig?: Record<string, unknown>;
}

export interface ModularTemplateConfig {
  theme?: Partial<TemplateTheme>;
  sections: Array<{
    id: string;
    config?: Record<string, unknown>;
    enabled: boolean;
  }>;
  layout: {
    type: "stack" | "grid" | "masonry";
    columns?: number;
    gap?: string;
  };
}

export const createModularTemplate = (config: ModularTemplateConfig) => {
  const ModularTemplate: React.FC<ModularTemplateProps> = ({ memorial }) => {
    return (
      <TemplateThemeProvider initialTheme={config.theme}>
        <div className="min-h-screen">
          {config.sections
            .filter((section) => section.enabled)
            .map((section) => {
              const sectionModule = sectionRegistry.getSection(section.id);
              if (!sectionModule) return null;

              const ModuleComponent = sectionModule.component;
              const sectionConfig = { ...sectionModule.defaultConfig, ...section.config };

              return (
                <div key={section.id} className="template-section">
                  <ModuleComponent memorial={memorial} config={sectionConfig} />
                </div>
              );
            })}
        </div>
      </TemplateThemeProvider>
    );
  };

  return ModularTemplate;
};
