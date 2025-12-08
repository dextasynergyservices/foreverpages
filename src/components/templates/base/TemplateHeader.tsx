import React from "react";
import { Template } from "@/generated/prisma";
import Image from "next/image";

interface TemplateHeaderProps {
  template: Template;
  memorial: {
    firstName: string;
    lastName: string;
    profilePhoto?: string | null;
    coverPhoto?: string | null;
  };
  config?: unknown;
}

export const TemplateHeader: React.FC<TemplateHeaderProps> = ({ memorial }) => {
  const headerContainerStyle: React.CSSProperties = {
    backgroundColor: "var(--color-header-bg, white)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  };

  const headerInnerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--spacing, 1.5rem)",
    paddingRight: "var(--spacing, 1.5rem)",
    paddingTop: "1.5rem",
    paddingBottom: "1.5rem",
  };

  const profileContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  };

  const nameTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-heading-size, 1.875rem)",
    fontWeight: "bold",
    color: "var(--color-header-text, #111827)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const memoTextStyle: React.CSSProperties = {
    color: "var(--color-secondary, #4b5563)",
    marginTop: "0.25rem",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const coverImageContainerStyle: React.CSSProperties = {
    height: "16rem",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundImage: memorial.coverPhoto ? `url(${memorial.coverPhoto})` : undefined,
  };

  return (
    <header style={{ position: "relative" }}>
      {memorial.coverPhoto && <div style={coverImageContainerStyle} />}

      <div style={headerContainerStyle}>
        <div style={headerInnerStyle}>
          <div style={profileContainerStyle}>
            {memorial.profilePhoto && (
              <Image
                src={memorial.profilePhoto}
                alt={`${memorial.firstName} ${memorial.lastName}`}
                style={{
                  width: "5rem",
                  height: "5rem",
                  borderRadius: "9999px",
                  objectFit: "cover",
                  border: "4px solid white",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                width={80}
                height={80}
              />
            )}
            <div>
              <h1 style={nameTitleStyle}>
                {memorial.firstName} {memorial.lastName}
              </h1>
              <p style={memoTextStyle}>In loving memory</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
