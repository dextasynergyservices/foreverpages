export * from "./registry";
export * from "../../components/templates/base/MemorialTemplate";
export * from "../../components/templates/base/TemplateHeader";
export * from "../../components/templates/base/TemplateNavigation";
export * from "../../components/templates/base/TemplateRenderer";

// Register templates
import { registerTemplate } from "./registry";
import { ClassicMemorialTemplate } from "../../components/templates/components/classic/MemorialTemplate";

registerTemplate("classic", {
  MemorialTemplate: ClassicMemorialTemplate,
});
