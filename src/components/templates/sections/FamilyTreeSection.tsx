import React from "react";
import { Memorial } from "@/generated/prisma";

interface FamilyTreeSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const FamilyTreeSection: React.FC<FamilyTreeSectionProps> = () => {
  // For now, this section is placeholder - family data comes from relations
  // TODO: Include family relations in memorial query
  return null;

  // Placeholder code for when family data is available
  /*
  const familyInfo = [];

  if (memorial.father || memorial.mother) {
    familyInfo.push({
      title: "Parents",
      members: [
        memorial.father && `Father: ${memorial.father}`,
        memorial.mother && `Mother: ${memorial.mother}`,
      ].filter(Boolean),
    });
  }

  if (familyInfo.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Family</h2>
        <div className="space-y-6">
          {familyInfo.map((group, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">{group.title}</h3>
              <div className="space-y-2">
                {group.members.map((member, memberIndex) => (
                  <p key={memberIndex} className="text-gray-700">
                    {member}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  */
};
