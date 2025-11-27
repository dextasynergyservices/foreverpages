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

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex space-x-8 overflow-x-auto">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange?.(section.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeSection === section.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
