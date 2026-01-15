import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Loved Forever - Memorial Page",
  description:
    "A spiritual memorial template with nature-inspired design, elegant lavender gradients, and warm golden accents",
};

export default function LovedForeverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
