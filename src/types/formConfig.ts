/**
 * Section configuration types for dynamic form rendering
 */

export type FieldType =
  | "text"
  | "email"
  | "date"
  | "textarea"
  | "select"
  | "file"
  | "checkbox"
  | "radio"
  | "number"
  | "phone"
  | "url";

export interface SelectOption {
  value: string;
  label: string;
  translationKey?: string;
}

export interface FormField {
  id: string;
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: unknown) => boolean | string;
  };
  options?: SelectOption[]; // For select, radio, checkbox
  defaultValue?: unknown;
  translationKey?: string; // For label
  translationPlaceholderKey?: string; // For placeholder
  translationHelpTextKey?: string; // For help text
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  columns?: number; // Grid columns for layout (1-4)
  visible?: boolean;
  order?: number;
  translationKey?: string;
  translationDescriptionKey?: string;
}

export interface TemplateConfiguration {
  id: string;
  name: string;
  slug: string;
  sections: FormSection[];
  version: number;
  supportedSections: string[]; // Array of section IDs supported by this template
}

export interface FormData {
  [key: string]: unknown;
}

export interface SectionMappings {
  [sectionId: string]: FormSection;
}

export interface FieldMappings {
  [fieldId: string]: FormField;
}
