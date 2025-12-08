"use client";

import React from "react";
import { DesignTokens } from "./TemplateCustomizer";
import { Heart } from "lucide-react";

interface CustomizationPreviewProps {
  designTokens: DesignTokens;
  memorialData?: {
    firstName: string;
    lastName: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
  };
}

export const CustomizationPreview: React.FC<CustomizationPreviewProps> = ({
  designTokens,
  memorialData = {
    firstName: "John",
    lastName: "Doe",
    birthYear: 1950,
    deathYear: 2024,
    biography: "A life well lived, remembered by family and friends.",
  },
}) => {
  const fontSizeMap = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const headingSizeMap = {
    small: 32,
    medium: 40,
    large: 48,
  };

  const fontFamilyStyle = {
    Inter: "Inter, sans-serif",
    Serif: "Georgia, serif",
    Poppins: "Poppins, sans-serif",
    "Open Sans": "'Open Sans', sans-serif",
  };

  const spacingPixels = {
    compact: 16,
    comfortable: 24,
    spacious: 32,
  };

  const borderRadiusPixels = {
    none: 0,
    subtle: 4,
    moderate: 8,
    rounded: 16,
  };

  const containerMaxWidth = {
    narrow: 672,
    standard: 896,
    wide: 1152,
  };

  const styles = {
    wrapper: {
      minHeight: "100vh",
      backgroundColor: designTokens.colors.bodyBg,
      color: designTokens.colors.bodyText,
      fontFamily: fontFamilyStyle[designTokens.fonts.fontFamily],
      padding: spacingPixels[designTokens.layout.spacing],
    },
    header: {
      backgroundColor: designTokens.colors.headerBg,
      color: designTokens.colors.headerText,
      padding: spacingPixels[designTokens.layout.spacing] * 1.5,
      borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
      marginBottom: spacingPixels[designTokens.layout.spacing],
      textAlign: "center" as const,
    },
    container: {
      maxWidth: containerMaxWidth[designTokens.layout.containerWidth],
      margin: "0 auto",
    },
    heading: {
      fontSize: headingSizeMap[designTokens.fonts.headingSize],
      fontWeight: 700,
      marginBottom: spacingPixels[designTokens.layout.spacing] / 2,
      color: designTokens.colors.headerText,
    },
    subheading: {
      fontSize: fontSizeMap[designTokens.fonts.bodySize],
      opacity: 0.9,
      color: designTokens.colors.headerText,
    },
    mainContent: {
      padding: spacingPixels[designTokens.layout.spacing],
      display: "flex",
      flexDirection: "column" as const,
      gap: spacingPixels[designTokens.layout.spacing],
    },
    section: {
      padding: spacingPixels[designTokens.layout.spacing],
      borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
      backgroundColor: designTokens.colors.bodyBg,
      border: `2px solid ${designTokens.colors.secondary}20`,
    },
    sectionTitle: {
      fontSize: headingSizeMap[designTokens.fonts.headingSize] * 0.7,
      fontWeight: 600,
      marginBottom: spacingPixels[designTokens.layout.spacing] / 2,
      color: designTokens.colors.primary,
    },
    sectionText: {
      fontSize: fontSizeMap[designTokens.fonts.bodySize],
      lineHeight: 1.6,
      color: designTokens.colors.bodyText,
    },
    accentBox: {
      padding: spacingPixels[designTokens.layout.spacing],
      borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
      backgroundColor: designTokens.colors.secondary + "15",
      borderLeft: `4px solid ${designTokens.colors.accent}`,
    },
    button: {
      display: "inline-block",
      padding: "12px 24px",
      backgroundColor: designTokens.colors.primary,
      color: designTokens.colors.bodyBg,
      borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
      fontSize: fontSizeMap[designTokens.fonts.bodySize],
      fontWeight: 600,
      cursor: "pointer",
      border: "none",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}
          >
            <Heart style={{ width: "28px", height: "28px", fill: "currentColor" }} />
            <h1 style={styles.heading}>
              {memorialData.firstName} {memorialData.lastName}
            </h1>
          </div>
          <p style={styles.subheading}>
            {memorialData.birthYear} – {memorialData.deathYear}
          </p>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Biography Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>About</h2>
            <p style={styles.sectionText}>{memorialData.biography}</p>
          </div>

          {/* Color Palette Preview */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Design Colors</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: spacingPixels[designTokens.layout.spacing],
              }}
            >
              {Object.entries(designTokens.colors).map(([name, color]) => (
                <div key={name} style={{ textAlign: "center" as const }}>
                  <div
                    style={{
                      width: "100%",
                      height: "60px",
                      backgroundColor: color,
                      borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
                      marginBottom: "8px",
                      border: `2px solid ${designTokens.colors.bodyText}20`,
                    }}
                  />
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: designTokens.colors.bodyText,
                      textTransform: "capitalize",
                    }}
                  >
                    {name}
                  </p>
                  <p
                    style={{ fontSize: "11px", color: designTokens.colors.bodyText, opacity: 0.7 }}
                  >
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Box Example */}
          <div style={styles.accentBox}>
            <h3 style={{ ...styles.sectionTitle, marginTop: 0 }}>Accent Box Example</h3>
            <p style={styles.sectionText}>
              This is how important information will be highlighted throughout your memorial page.
            </p>
          </div>

          {/* Button Example */}
          <div
            style={{
              textAlign: "center" as const,
              marginTop: spacingPixels[designTokens.layout.spacing],
            }}
          >
            <button style={styles.button}>Learn More</button>
          </div>

          {/* Typography Showcase */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Typography</h2>
            <div
              style={{
                ...styles.sectionText,
                marginBottom: spacingPixels[designTokens.layout.spacing],
              }}
            >
              <p
                style={{
                  fontSize: headingSizeMap[designTokens.fonts.headingSize],
                  fontWeight: 700,
                  margin: "0 0 8px 0",
                }}
              >
                Large Heading
              </p>
              <p
                style={{
                  fontSize: headingSizeMap[designTokens.fonts.headingSize] * 0.8,
                  fontWeight: 600,
                  margin: "0 0 8px 0",
                }}
              >
                Medium Heading
              </p>
              <p
                style={{ fontSize: fontSizeMap[designTokens.fonts.bodySize], margin: "0 0 8px 0" }}
              >
                Regular body text displays your memorial content in this size and style.
              </p>
              <p style={{ fontSize: fontSizeMap[designTokens.fonts.bodySize] * 0.9, opacity: 0.7 }}>
                Small text for captions and secondary information.
              </p>
            </div>
          </div>

          {/* Layout Showcase */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Layout & Spacing</h2>
            <p style={styles.sectionText}>
              Spacing is set to <strong>{designTokens.layout.spacing}</strong> and corners are{" "}
              <strong>{designTokens.layout.borderRadius}</strong>. Content width is{" "}
              <strong>{designTokens.layout.containerWidth}</strong>.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: spacingPixels[designTokens.layout.spacing],
                marginTop: spacingPixels[designTokens.layout.spacing],
              }}
            >
              <div
                style={{
                  padding: spacingPixels[designTokens.layout.spacing],
                  backgroundColor: designTokens.colors.secondary + "20",
                  borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
                }}
              >
                <p style={{ fontSize: "12px", margin: 0 }}>Layout Element 1</p>
              </div>
              <div
                style={{
                  padding: spacingPixels[designTokens.layout.spacing],
                  backgroundColor: designTokens.colors.accent + "20",
                  borderRadius: borderRadiusPixels[designTokens.layout.borderRadius],
                }}
              >
                <p style={{ fontSize: "12px", margin: 0 }}>Layout Element 2</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
