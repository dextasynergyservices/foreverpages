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

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Gallery</h2>
        <div
          className={`grid gap-4 ${layout === "GRID" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {images.map((image, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg shadow-sm">
              <Image
                src={image}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
