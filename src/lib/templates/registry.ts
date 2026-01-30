import React from "react";
import type { Template, UserTemplate, Memorial } from "@/generated/prisma";

export interface TemplateProps {
  memorial: Memorial & {
    owner?: {
      id: string;
      name: string | null;
      email: string;
      accountDetails?: unknown[];
    };
  };
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

export interface HeaderProps {
  template: Template;
  memorial: {
    firstName: string;
    lastName: string;
    profilePhoto?: string | null;
    coverPhoto?: string | null;
  };
  config?: Record<string, unknown>;
}

export interface NavigationProps {
  template: Template;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  config?: Record<string, unknown>;
}

export interface TemplateComponent {
  MemorialTemplate: React.ComponentType<TemplateProps>;
  Header?: React.ComponentType<HeaderProps>;
  Navigation?: React.ComponentType<NavigationProps>;
}

const templateRegistry = new Map<string, TemplateComponent>();

export const registerTemplate = (slug: string, component: TemplateComponent) => {
  templateRegistry.set(slug, component);
};

export const getTemplateComponent = (slug: string): TemplateComponent | null => {
  return templateRegistry.get(slug) || null;
};

export const getAllRegisteredTemplates = (): string[] => {
  return Array.from(templateRegistry.keys());
};
