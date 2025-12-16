import { DesignTokens } from "./types";

export const defaultDesign: DesignTokens = {
  colors: {
    primary: "#722F37", // burgundy
    secondary: "#4A2545", // deep-plum
    accent: "#D4AF37", // soft-gold
    background: "#F5F5F0", // cream
    text: "#3D2020", // dark brown
    muted: "#8B7E74", // muted brown
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
    accent: "Playfair Display, serif",
  },
  layout: {
    maxWidth: "1280px",
    heroHeight: "600px",
    sectionSpacing: "80px",
  },
};

export const templateConfig = {
  name: "Peace Template",
  slug: "peace-template",
  version: "1.0.0",
  description:
    "An elegant memorial template featuring life stages carousel, timeline, and sophisticated burgundy tones",

  sections: [
    { id: "hero", name: "Hero Section", component: "HeroModern", required: true },
    { id: "biography", name: "Biography", component: "Biography", required: true },
    { id: "timeline", name: "Timeline", component: "TimelineHorizontal", required: false },
    { id: "gallery", name: "Gallery", component: "GalleryModern", required: false },
    { id: "family", name: "Family Tree", component: "FamilyTree", required: false },
    { id: "video", name: "Video Tributes", component: "VideoTributes", required: false },
    { id: "tributes", name: "Tributes", component: "TributesModern", required: false },
  ],

  defaultDesign,

  customization: {
    colors: {
      primary: { label: "Primary Color", default: "#722F37" },
      secondary: { label: "Secondary Color", default: "#4A2545" },
      accent: { label: "Accent Color", default: "#D4AF37" },
      background: { label: "Background", default: "#F5F5F0" },
      text: { label: "Text Color", default: "#3D2020" },
      muted: { label: "Muted Text", default: "#8B7E74" },
    },
    fonts: {
      heading: { label: "Heading Font", default: "Inter, sans-serif" },
      body: { label: "Body Font", default: "Inter, sans-serif" },
      accent: { label: "Accent Font", default: "Playfair Display, serif" },
    },
    layout: {
      maxWidth: { label: "Max Width", default: "1280px" },
      heroHeight: { label: "Hero Height", default: "600px" },
      sectionSpacing: { label: "Section Spacing", default: "80px" },
    },
  },
};

export default templateConfig;
