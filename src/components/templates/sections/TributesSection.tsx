import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface TributesSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const TributesSection: React.FC<TributesSectionProps> = ({ memorial }) => {
  const { t } = useTranslations();

  // Check for available tribute content
  const hasTributes = memorial.legacy || memorial.lifeStory;

  if (!hasTributes) return null;

  const sectionStyle: React.CSSProperties = {
    paddingTop: "var(--spacing, 3rem)",
    paddingBottom: "var(--spacing, 3rem)",
    backgroundColor: "var(--color-header-bg, white)",
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

  const tributeBoxStyle: React.CSSProperties = {
    backgroundColor: "var(--color-body-bg, #f3f4f6)",
    borderRadius: "var(--border-radius, 0.5rem)",
    padding: "1.5rem",
    marginBottom: "2rem",
  };

  const tributeHeadingStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "var(--color-header-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const tributeTextStyle: React.CSSProperties = {
    color: "var(--color-body-text, #374151)",
    lineHeight: "1.625",
    whiteSpace: "pre-wrap",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>
          {t("dashboard.pageBuilder.templates.content.tributes.title", {}, "Tributes & Memories")}
        </h2>
        <div>
          {memorial.legacy && (
            <div style={tributeBoxStyle}>
              <h3 style={tributeHeadingStyle}>
                {t("dashboard.pageBuilder.templates.content.tributes.legacy", {}, "Legacy")}
              </h3>
              <p style={tributeTextStyle}>{memorial.legacy}</p>
            </div>
          )}

          {memorial.lifeStory && (
            <div style={tributeBoxStyle}>
              <h3 style={tributeHeadingStyle}>
                {t("dashboard.pageBuilder.templates.content.tributes.lifeStory", {}, "Life Story")}
              </h3>
              <p style={tributeTextStyle}>{memorial.lifeStory}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
