import React from "react";
import { SectionProps, registerSection } from "./sectionRegistry";

export const createSection = <T extends Record<string, unknown> = Record<string, unknown>>(
  id: string,
  // Accept any component shape to allow per-section typed props
  component: React.ComponentType<SectionProps & { config?: T }>,
  options: {
    displayName: string;
    category: string;
    icon?: string;
    defaultConfig?: T;
  }
) => {
  const SectionWrapper: React.ComponentType<SectionProps & { config?: T }> = (props) => {
    const config = { ...options.defaultConfig, ...props.config } as T;
    return React.createElement(component, { ...props, config });
  };

  registerSection(id, {
    component: SectionWrapper as unknown as Parameters<typeof registerSection>[1]["component"],
    defaultConfig: options.defaultConfig,
    displayName: options.displayName,
    category: options.category,
    icon: options.icon,
  });

  return SectionWrapper;
};

export const withSectionWrapper = <P extends SectionProps>(
  Component: React.ComponentType<P>,
  wrapperClassName?: string
) => {
  const WrappedSection: React.ComponentType<P> = (props) =>
    React.createElement(
      "section",
      { className: wrapperClassName || "" },
      React.createElement(Component, { ...props } as P)
    );

  WrappedSection.displayName = `WrappedSection(${Component.displayName || Component.name})`;
  return WrappedSection;
};
