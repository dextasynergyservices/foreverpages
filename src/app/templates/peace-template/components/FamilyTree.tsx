"use client";

import { Heart } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

// Helper to determine generation level from relationship
const getGenerationLevel = (relationship: string): number => {
  const rel = relationship.toLowerCase();
  // Level 0: Self and spouse
  if (
    rel.includes("self") ||
    rel.includes("deceased") ||
    rel.includes("spouse") ||
    rel.includes("wife") ||
    rel.includes("husband")
  ) {
    return 0;
  }
  // Level 1: Children
  if (rel.includes("son") || rel.includes("daughter") || rel.includes("child")) {
    return 1;
  }
  // Level 2: Grandchildren and beyond
  if (rel.includes("grand") || rel.includes("nephew") || rel.includes("niece")) {
    return 2;
  }
  // Default to level 1 for other relationships
  return 1;
};

export const FamilyTree = () => {
  const { sectionsData, memorial } = useTemplate();

  // Get FAMILY_TREE section data with fallbacks
  const familyData = (sectionsData?.FAMILY_TREE as any) || {};

  // Transform members from editor format to template format
  const transformMembers = (members: any[]) => {
    return members.map((member, index) => ({
      name: member.name || "",
      relation: member.relationship || member.relation || "",
      level: member.level ?? getGenerationLevel(member.relationship || member.relation || ""),
      image:
        member.photo ||
        member.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "Member")}&background=random`,
    }));
  };

  // Only use user-provided members if available, otherwise show placeholder
  const userMembers = familyData.members;
  const hasUserMembers =
    userMembers &&
    Array.isArray(userMembers) &&
    userMembers.length > 0 &&
    userMembers.some((m: any) => m.name);

  // If user has added members, use them; otherwise show empty state or placeholder
  const familyMembers = hasUserMembers ? transformMembers(userMembers) : [];

  const sectionTitle = familyData.title || "Our Family Circle";
  const sectionSubtitle =
    familyData.subtitle || "A legacy of love that continues through generations";

  // If no family members, show a placeholder message
  if (familyMembers.length === 0) {
    return (
      <section className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 animate-fade-in text-center">
            <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
              {sectionTitle}
            </h2>
            <div className="mx-auto h-1 w-32 rounded-full bg-soft-gold" />
            <p className="mt-6 text-lg text-cream/80">{sectionSubtitle}</p>
          </div>
          <div className="rounded-2xl border border-cream/20 bg-cream/10 p-12 text-center shadow-elegant backdrop-blur-sm">
            <Heart className="mx-auto mb-4 h-16 w-16 text-cream/40" />
            <p className="text-lg text-cream/60">Family members will appear here</p>
            <p className="mt-2 text-sm text-cream/40">
              Add family members in the page builder to display them
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            {sectionTitle}
          </h2>
          <div className="mx-auto h-1 w-32 rounded-full bg-soft-gold" />
          <p className="mt-6 text-lg text-cream/80">{sectionSubtitle}</p>
        </div>

        <div className="rounded-2xl border border-cream/20 bg-cream/10 p-8 shadow-elegant backdrop-blur-sm md:p-12">
          {/* Generation 1 - Self & Spouse */}
          {familyMembers.filter((m: any) => m.level === 0).length > 0 && (
            <>
              <div className="mb-16 flex justify-center gap-8">
                {familyMembers
                  .filter((m: any) => m.level === 0)
                  .map((member: any, index: number) => (
                    <div
                      key={index}
                      className="group animate-fade-in text-center"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-soft-gold shadow-lg transition-transform group-hover:scale-105">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-soft-gold/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <Heart className="h-8 w-8 text-burgundy" />
                        </div>
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-cream">
                        {member.name}
                      </h3>
                      <p className="text-sm text-cream/80">{member.relation}</p>
                    </div>
                  ))}
              </div>
              {/* Connecting Line */}
              {familyMembers.filter((m: any) => m.level === 1).length > 0 && (
                <div className="mb-8 flex justify-center">
                  <div className="h-12 w-1 bg-soft-gold/50" />
                </div>
              )}
            </>
          )}

          {/* Generation 2 - Children */}
          {familyMembers.filter((m: any) => m.level === 1).length > 0 && (
            <>
              <div className="mb-16 flex flex-wrap justify-center gap-8">
                {familyMembers
                  .filter((m: any) => m.level === 1)
                  .map((member: any, index: number) => (
                    <div
                      key={index}
                      className="group animate-fade-in text-center"
                      style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                    >
                      <div className="relative mx-auto mb-3 h-24 w-24 overflow-hidden rounded-full border-4 border-soft-gold/80 shadow-lg transition-transform group-hover:scale-105">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-soft-gold/25 opacity-0 transition-opacity group-hover:opacity-100">
                          <Heart className="h-6 w-6 text-burgundy" />
                        </div>
                      </div>
                      <h4 className="font-heading font-semibold text-cream">{member.name}</h4>
                      <p className="text-xs text-cream/80">{member.relation}</p>
                    </div>
                  ))}
              </div>
              {/* Connecting Line */}
              {familyMembers.filter((m: any) => m.level === 2).length > 0 && (
                <div className="mb-8 flex justify-center">
                  <div className="h-12 w-1 bg-soft-gold/50" />
                </div>
              )}
            </>
          )}

          {/* Generation 3 - Grandchildren */}
          {familyMembers.filter((m: any) => m.level === 2).length > 0 && (
            <div className="flex flex-wrap justify-center gap-6">
              {familyMembers
                .filter((m: any) => m.level === 2)
                .map((member: any, index: number) => (
                  <div
                    key={index}
                    className="group animate-fade-in text-center"
                    style={{ animationDelay: `${(index + 5) * 0.1}s` }}
                  >
                    <div className="border-3 relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-full border-soft-gold/60 shadow-md transition-transform group-hover:scale-105">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-soft-gold/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <Heart className="h-5 w-5 text-burgundy" />
                      </div>
                    </div>
                    <h5 className="font-heading text-sm font-semibold text-cream">{member.name}</h5>
                    <p className="text-xs text-cream/80">{member.relation}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
