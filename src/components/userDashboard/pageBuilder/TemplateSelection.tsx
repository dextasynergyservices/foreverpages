import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/hooks/useTheme";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface TemplateSelectionProps {
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  templates: Template[];
}

export const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  templates,
}) => {
  const { theme } = useTheme();
  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-100";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? "ring-2 ring-black dark:ring-white shadow-lg"
                : "hover:shadow-md"
            } ${cardBorder} ${cardBg}`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardContent className="p-0">
              <div className={`aspect-video rounded-t-lg overflow-hidden ${bgMuted}`}>
                <Image
                  src={template.preview}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  width={400}
                  height={225}
                />
              </div>
              <div className="p-4 md:p-6">
                <h3 className="font-serif font-semibold text-lg mb-2">{template.name}</h3>
                <p className={`text-sm mb-4 ${textMuted}`}>{template.description}</p>
                <div className="space-y-1">
                  {template.features.map((feature, idx) => (
                    <div key={idx} className={`flex items-center text-xs ${textMuted}`}>
                      <CheckCircle className="h-3 w-3 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                {/* If this is a marketplace template, show a Use button */}
                {template.id?.toString().startsWith("marketplace:") && (
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template.id);
                      }}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Use this template
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
