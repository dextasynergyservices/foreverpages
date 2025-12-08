import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface TimelineSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ memorial }) => {
  const { t } = useTranslations();

  // For now, show basic life dates
  if (!memorial.birthDate || !memorial.deathDate) return null;

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

  const timelineItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  };

  const dotStyle = (color: string): React.CSSProperties => ({
    width: "1rem",
    height: "1rem",
    borderRadius: "9999px",
    backgroundColor: color,
    flexShrink: 0,
  });

  const itemTitleStyle: React.CSSProperties = {
    fontWeight: "600",
    color: "var(--color-body-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const itemTextStyle: React.CSSProperties = {
    color: "var(--color-secondary, #4b5563)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>
          {t("dashboard.pageBuilder.templates.content.timeline.title", {}, "Life Timeline")}
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={timelineItemStyle}>
            <div style={dotStyle("var(--color-accent, #3b82f6)")}></div>
            <div>
              <h3 style={itemTitleStyle}>
                {t("dashboard.pageBuilder.templates.content.timeline.born", {}, "Born")}
              </h3>
              <p style={itemTextStyle}>
                {new Date(memorial.birthDate).toLocaleDateString()}
                {memorial.birthPlace && ` in ${memorial.birthPlace}`}
              </p>
            </div>
          </div>
          <div style={timelineItemStyle}>
            <div style={dotStyle("var(--color-primary, #ef4444)")}></div>
            <div>
              <h3 style={itemTitleStyle}>
                {t(
                  "dashboard.pageBuilder.templates.content.timeline.passedAway",
                  {},
                  "Passed Away"
                )}
              </h3>
              <p style={itemTextStyle}>
                {new Date(memorial.deathDate).toLocaleDateString()}
                {memorial.deathPlace && ` in ${memorial.deathPlace}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
