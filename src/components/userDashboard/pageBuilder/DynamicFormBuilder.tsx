import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { FormField, FormSection, FormData } from "@/types/formConfig";
import { GripVertical, Eye, EyeOff } from "lucide-react";

interface DynamicFormBuilderProps {
  sections: FormSection[];
  onDataChange: (data: FormData) => void;
  initialData?: FormData;
  isAutoSaving?: boolean;
  readOnly?: boolean;
  showSectionControls?: boolean;
  onSectionVisibilityChange?: (sectionId: string, visible: boolean) => void;
  onSectionReorder?: (sections: FormSection[]) => void;
}

export const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  sections,
  onDataChange,
  initialData = {},
  isAutoSaving = false,
  readOnly = false,
  showSectionControls = false,
  onSectionVisibilityChange,
  onSectionReorder,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => ({ ...acc, [section.id]: section.visible !== false }), {})
  );

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-50";
  const borderMuted = theme === "dark" ? "border-white/10" : "border-gray-200";

  // Handle field value changes
  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      const newData = { ...formData, [fieldId]: value };
      setFormData(newData);
      onDataChange(newData);
    },
    [formData, onDataChange]
  );

  // Handle section visibility toggle
  const handleSectionVisibilityToggle = useCallback(
    (sectionId: string) => {
      const newVisibility = !visibleSections[sectionId];
      setVisibleSections((prev) => ({ ...prev, [sectionId]: newVisibility }));
      onSectionVisibilityChange?.(sectionId, newVisibility);
    },
    [visibleSections, onSectionVisibilityChange]
  );

  // Handle section drag start
  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  // Handle section drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle section drop
  const handleDrop = (targetSectionId: string) => {
    if (!draggedSection || draggedSection === targetSectionId) {
      setDraggedSection(null);
      return;
    }

    const draggedIndex = sections.findIndex((s) => s.id === draggedSection);
    const targetIndex = sections.findIndex((s) => s.id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSection(null);
      return;
    }

    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, movedSection);

    onSectionReorder?.(newSections);
    setDraggedSection(null);
  };

  // Render a single form field
  const renderField = (field: FormField) => {
    const fieldValue = formData[field.id] ?? field.defaultValue ?? "";
    const label = field.translationKey ? t(field.translationKey, {}, field.label) : field.label;
    const placeholder = field.translationPlaceholderKey
      ? t(field.translationPlaceholderKey, {}, field.placeholder || "")
      : field.placeholder;
    const helpText = field.translationHelpTextKey
      ? t(field.translationHelpTextKey, {}, field.helpText || "")
      : field.helpText;

    const commonProps = {
      id: field.id,
      placeholder,
      disabled: readOnly,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleFieldChange(field.id, e.target.value);
      },
    };

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} type={field.type} value={fieldValue as string} />
            {helpText && <p className={`text-sm mt-1 ${textMuted}`}>{helpText}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} type="number" value={fieldValue as string | number} />
            {helpText && <p className={`text-sm mt-1 ${textMuted}`}>{helpText}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} type="date" value={fieldValue as string} />
            {helpText && <p className={`text-sm mt-1 ${textMuted}`}>{helpText}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={placeholder}
              disabled={readOnly}
              rows={4}
              value={fieldValue as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {helpText && <p className={`text-sm mt-1 ${textMuted}`}>{helpText}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue as string}
              onValueChange={(value) => handleFieldChange(field.id, value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => {
                  const optionLabel = option.translationKey
                    ? t(option.translationKey, {}, option.label)
                    : option.label;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      {optionLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {helpText && <p className={`text-sm mt-1 ${textMuted}`}>{helpText}</p>}
          </div>
        );

      case "file":
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="file"
              accept="image/*"
              onChange={(e) => handleFieldChange(field.id, e.target.files?.[0] || null)}
            />
            {helpText && <p className={`text-sm mt-1 ${textMuted}`}>{helpText}</p>}
          </div>
        );

      case "checkbox":
      case "radio":
      default:
        return null;
    }
  };

  // Render a single section
  const renderSection = (section: FormSection) => {
    const isVisible = visibleSections[section.id] ?? true;
    const sectionTitle = section.translationKey
      ? t(section.translationKey, {}, section.title)
      : section.title;
    const sectionDescription = section.translationDescriptionKey
      ? t(section.translationDescriptionKey, {}, section.description || "")
      : section.description;

    return (
      <div
        key={section.id}
        draggable={showSectionControls}
        onDragStart={() => handleDragStart(section.id)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(section.id)}
        className={`border rounded-lg p-6 ${!isVisible ? "opacity-50" : ""} ${
          draggedSection === section.id ? "bg-blue-50 dark:bg-blue-900/20" : bgMuted
        } ${borderMuted} transition-all`}
      >
        {/* Section Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            {showSectionControls && (
              <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing" />
            )}
            <div>
              <h3 className="font-semibold text-lg">{sectionTitle}</h3>
              {sectionDescription && (
                <p className={`text-sm mt-1 ${textMuted}`}>{sectionDescription}</p>
              )}
            </div>
          </div>

          {showSectionControls && (
            <button
              onClick={() => handleSectionVisibilityToggle(section.id)}
              className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors"
              title={isVisible ? "Hide section" : "Show section"}
            >
              {isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </div>

        {/* Section Fields */}
        {isVisible && (
          <div
            className={`grid gap-6 ${
              section.columns ? `grid-cols-1 md:grid-cols-${section.columns}` : "grid-cols-1"
            }`}
            style={{
              gridTemplateColumns: section.columns ? `repeat(auto-fit, minmax(250px, 1fr))` : "1fr",
            }}
          >
            {section.fields.map((field) => renderField(field))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isAutoSaving && (
        <div className={`text-sm ${textMuted} text-center p-3 rounded-lg ${bgMuted}`}>
          {t("dashboard.pageBuilder.form.saving", {}, "Saving...")}
        </div>
      )}

      {sections.map((section) => renderSection(section))}
    </div>
  );
};
