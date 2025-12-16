import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Light Template - Memorial Page",
  description: "A spiritual memorial template with elegant animations and serene design",
};

export default function LightTemplateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
