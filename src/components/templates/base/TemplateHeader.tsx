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
  return (
    <header className="relative">
      {memorial.coverPhoto && (
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${memorial.coverPhoto})` }}
        />
      )}

      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            {memorial.profilePhoto && (
              <Image
                src={memorial.profilePhoto}
                alt={`${memorial.firstName} ${memorial.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                width={80}
                height={80}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {memorial.firstName} {memorial.lastName}
              </h1>
              <p className="text-gray-600 mt-1">In loving memory</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
