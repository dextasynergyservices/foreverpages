import React from "react";
import type { ReactNode } from "react";
import App from "./src/App";

interface MemorialTemplateProps {
  [key: string]: unknown;
}

export default function MemorialTemplate(props: MemorialTemplateProps): ReactNode {
  return <App {...props} />;
}
