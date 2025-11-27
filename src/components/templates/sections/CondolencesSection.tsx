import React from "react";
import { Memorial } from "@/generated/prisma";

interface CondolencesSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const CondolencesSection: React.FC<CondolencesSectionProps> = ({ memorial }) => {
  // For now, show placeholder - condolences would come from posts/comments with condolence type
  // TODO: Include condolence posts in memorial query
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Condolences</h2>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600 mb-4">
            Share your thoughts and memories with the family of {memorial.firstName}{" "}
            {memorial.lastName}.
          </p>
          <p className="text-sm text-gray-500">Condolence messages will appear here.</p>
        </div>
      </div>
    </section>
  );
};
