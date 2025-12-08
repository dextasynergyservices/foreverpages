import React from "react";
import { Memorial } from "@/generated/prisma";

interface SupportSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const SupportSection: React.FC<SupportSectionProps> = ({ memorial }) => {
  // Show support options like donations, virtual candles, flowers
  const hasSupport = memorial.charityName || memorial.donationInfo;

  if (!hasSupport && !memorial.allowCandles && !memorial.allowFlowers) return null;

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

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-body-bg, #f3f4f6)",
    borderRadius: "var(--border-radius, 0.5rem)",
    padding: "1.5rem",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "var(--color-header-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const cardTextStyle: React.CSSProperties = {
    color: "var(--color-body-text, #374151)",
    marginBottom: "1rem",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
  };

  const charityNameStyle: React.CSSProperties = {
    fontWeight: "500",
    color: "var(--color-header-text, #111827)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const linkStyle: React.CSSProperties = {
    color: "var(--color-accent, #3b82f6)",
    textDecoration: "none",
    marginTop: "0.5rem",
    display: "inline-block",
  };

  const linkHoverStyle: React.CSSProperties = {
    color: "var(--color-primary, #1e40af)",
  };

  const supportItemStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-body-text, #4b5563)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>Support the Family</h2>
        <div style={gridStyle}>
          {memorial.charityName && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Charitable Donations</h3>
              <p style={cardTextStyle}>In lieu of flowers, the family suggests donations to:</p>
              <p style={charityNameStyle}>{memorial.charityName}</p>
              {memorial.charityUrl && (
                <a
                  href={memorial.charityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                  onMouseLeave={(e) =>
                    Object.assign(e.currentTarget.style, { color: "var(--color-accent, #3b82f6)" })
                  }
                >
                  Visit Charity Website →
                </a>
              )}
              {memorial.donationInfo && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-secondary, #4b5563)",
                    marginTop: "0.5rem",
                    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
                  }}
                >
                  {memorial.donationInfo}
                </p>
              )}
            </div>
          )}

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Virtual Tributes</h3>
            <p style={cardTextStyle}>Show your support with virtual candles and flowers.</p>
            <div>
              {memorial.allowCandles && <p style={supportItemStyle}>🕯️ Light a virtual candle</p>}
              {memorial.allowFlowers && <p style={supportItemStyle}>🌹 Send virtual flowers</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
