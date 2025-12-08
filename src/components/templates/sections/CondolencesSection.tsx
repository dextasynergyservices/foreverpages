import React from "react";
import { Memorial } from "@/generated/prisma";

interface CondolencesSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const CondolencesSection: React.FC<CondolencesSectionProps> = ({ memorial }) => {
  // For now, show placeholder - condolences would come from posts/comments with condolence type
  // TODO: Include condolence posts in memorial query

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
    textAlign: "center",
  };

  const messageTextStyle: React.CSSProperties = {
    color: "var(--color-body-text, #4b5563)",
    marginBottom: "1rem",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
  };

  const placeholderTextStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-secondary, #9ca3af)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>Condolences</h2>
        <div style={contentBoxStyle}>
          <p style={messageTextStyle}>
            Share your thoughts and memories with the family of {memorial.firstName}{" "}
            {memorial.lastName}.
          </p>
          <p style={placeholderTextStyle}>Condolence messages will appear here.</p>
        </div>
      </div>
    </section>
  );
};
