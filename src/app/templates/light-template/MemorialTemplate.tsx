import React from "react";
import type { ReactNode } from "react";
import App from "./src/App";
import { TemplateProps } from "@/lib/templates/registry";

export default function MemorialTemplate(props: TemplateProps): ReactNode {
  // Light template doesn't use the memorial/userTemplate props yet
  // It's a standalone Vite app that will be integrated later
  return <App {...(props as any)} />;
}

export const LightMemorialTemplate = MemorialTemplate;
