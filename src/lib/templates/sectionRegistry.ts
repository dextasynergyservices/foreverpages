import React from "react";
import { Memorial } from "@/generated/prisma";

export interface SectionProps {
  memorial: Memorial;
  config: Record<string, unknown>;
  className?: string;
}

export interface SectionComponent {
  component: React.ComponentType<SectionProps>;
  defaultConfig?: Record<string, unknown>;
  displayName: string;
  category: string;
  icon?: string;
}

class SectionRegistry {
  private sections = new Map<string, SectionComponent>();

  register(id: string, section: SectionComponent) {
    this.sections.set(id, section);
  }

  get(id: string): SectionComponent | null {
    return this.sections.get(id) || null;
  }

  getAll(): Map<string, SectionComponent> {
    return new Map(this.sections);
  }

  getByCategory(category: string): SectionComponent[] {
    return Array.from(this.sections.values()).filter((section) => section.category === category);
  }

  getCategories(): string[] {
    return Array.from(new Set(Array.from(this.sections.values()).map((s) => s.category)));
  }
}

export const sectionRegistry = new SectionRegistry();

export const registerSection = (id: string, section: SectionComponent) => {
  sectionRegistry.register(id, section);
};

export const getSection = (id: string) => sectionRegistry.get(id);

export const getAllSections = () => sectionRegistry.getAll();

export const getSectionsByCategory = (category: string) => sectionRegistry.getByCategory(category);

export const getSectionCategories = () => sectionRegistry.getCategories();
