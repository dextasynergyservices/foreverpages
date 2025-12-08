import React from "react";
import { Template, TemplateSectionType } from "@/generated/prisma";

interface TemplateNavigationProps {
  template: Template;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  config?: unknown;
}

export const TemplateNavigation: React.FC<TemplateNavigationProps> = ({
  template,
  activeSection,
  onSectionChange,
}) => {
  const sections = template.supportedSections || [];

  const defaultSections = [
    { id: "hero", label: "Home", type: TemplateSectionType.HERO },
    { id: "biography", label: "Biography", type: TemplateSectionType.BIOGRAPHY },
    { id: "gallery", label: "Gallery", type: TemplateSectionType.GALLERY },
    { id: "timeline", label: "Timeline", type: TemplateSectionType.TIMELINE },
    { id: "tributes", label: "Tributes", type: TemplateSectionType.TRIBUTES },
    { id: "guestbook", label: "Guestbook", type: TemplateSectionType.GUESTBOOK },
  ];

  const visibleSections = defaultSections.filter((section) => sections.includes(section.type));

  const navStyle: React.CSSProperties = {
    backgroundColor: "var(--color-header-bg, white)",
    borderBottom: "1px solid var(--color-secondary, #e5e7eb)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  const navContainerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--spacing, 1.5rem)",
    paddingRight: "var(--spacing, 1.5rem)",
    display: "flex",
    gap: "2rem",
    overflowX: "auto",
  };

  const navButtonStyle = (isActive: boolean): React.CSSProperties => ({
    paddingTop: "1rem",
    paddingBottom: "1rem",
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
    borderBottom: isActive ? "2px solid var(--color-accent, #3b82f6)" : "2px solid transparent",
    fontWeight: "500",
    fontSize: "0.875rem",
    whiteSpace: "nowrap",
    color: isActive ? "var(--color-accent, #3b82f6)" : "var(--color-secondary, #6b7280)",
    backgroundColor: "transparent",
    cursor: "pointer",
    border: "none",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    transition: "all 0.2s ease",
  });

  return (
    <nav style={navStyle}>
      <div style={navContainerStyle}>
        {visibleSections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange?.(section.id)}
            style={navButtonStyle(activeSection === section.id)}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) {
                e.currentTarget.style.color = "var(--color-header-text, #374151)";
                e.currentTarget.style.borderBottomColor = "var(--color-secondary, #d1d5db)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) {
                e.currentTarget.style.color = "var(--color-secondary, #6b7280)";
                e.currentTarget.style.borderBottomColor = "transparent";
              }
            }}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
