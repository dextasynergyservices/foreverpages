import React from "react";
import { Memorial } from "@/generated/prisma";
import Image from "next/image";

interface GallerySectionProps {
  memorial: Memorial;
  layout?: string;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ memorial, layout = "GRID" }) => {
  const images = memorial.galleryPhotos || [];

  if (images.length === 0) return null;

  const sectionStyle: React.CSSProperties = {
    paddingTop: "var(--spacing, 3rem)",
    paddingBottom: "var(--spacing, 3rem)",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 72rem)",
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
    gridTemplateColumns: layout === "GRID" ? "repeat(auto-fill, minmax(250px, 1fr))" : "1fr",
    gap: "1rem",
  };

  const imageContainerStyle: React.CSSProperties = {
    aspectRatio: "1",
    overflow: "hidden",
    borderRadius: "var(--border-radius, 0.5rem)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    transition: "transform 0.3s ease",
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>Gallery</h2>
        <div style={gridStyle}>
          {images.map((image, index) => (
            <div
              key={index}
              style={imageContainerStyle}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Image
                src={image}
                alt={`Gallery image ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                width={300}
                height={300}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
