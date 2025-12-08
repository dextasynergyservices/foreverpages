import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface BiographySectionProps {
  memorial: Memorial;
  layout?: string;
}

export const BiographySection: React.FC<BiographySectionProps> = ({ memorial }) => {
  const { t } = useTranslations();

  if (!memorial.biography) return null;

  const sectionStyle: React.CSSProperties = {
    paddingTop: "var(--spacing, 3rem)",
    paddingBottom: "var(--spacing, 3rem)",
    backgroundColor: "var(--color-body-bg, #f3f4f6)",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--spacing, 1.5rem)",
    paddingRight: "var(--spacing, 1.5rem)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-heading-size, 1.875rem)",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "2rem",
    color: "var(--color-header-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const contentBoxStyle: React.CSSProperties = {
    backgroundColor: "var(--color-header-bg, white)",
    borderRadius: "var(--border-radius, 0.5rem)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    padding: "2rem",
  };

  const biographyTextStyle: React.CSSProperties = {
    color: "var(--color-body-text, #374151)",
    lineHeight: "1.75",
    whiteSpace: "pre-wrap",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>
          {t("dashboard.pageBuilder.templates.content.biography.title", {}, "Biography")}
        </h2>
        <div style={contentBoxStyle}>
          <div>
            <p style={biographyTextStyle}>{memorial.biography}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
