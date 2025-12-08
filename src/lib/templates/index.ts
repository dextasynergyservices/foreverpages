export * from "./registry";
export * from "./dynamic-loader";
export * from "../../components/templates/base/MemorialTemplate";
export * from "../../components/templates/base/TemplateHeader";
export * from "../../components/templates/base/TemplateNavigation";
export * from "../../components/templates/base/TemplateRenderer";

// Register static templates (templates bundled with the app)
import { registerTemplate } from "./registry";
import { ClassicMemorialTemplate } from "../../components/templates/components/classic/MemorialTemplate";

// Register classic template (always available)
registerTemplate("classic", {
  MemorialTemplate: ClassicMemorialTemplate,
});

// Note: Uploaded templates in /app/templates/ are excluded from Next.js build.
// They are standalone Vite/React apps that are served separately.
// For now, only templates in /components/templates/components/ can be dynamically loaded.
// Dynamic loading via dynamic-loader.ts attempts to load from:
// - /components/templates/components/{slug}/MemorialTemplate.tsx
