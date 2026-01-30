"use client";

import { Users, Heart } from "lucide-react";
import Image from "next/image";
import { useTemplate } from "../TemplateProvider";

// Placeholder image for missing photos
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxoorukfj/image/upload/v1764852176/thomas1_itt2fo.png";

interface FamilyMember {
  id: number | string;
  name: string;
  photo?: string;
  image?: string;
  relation?: string;
  relationship?: string;
  grandchildren?: FamilyMember[];
}

interface FamilyData {
  name: string;
  photo: string;
  spouse?: {
    name: string;
    photo: string;
  };
  children: FamilyMember[];
  quote?: string;
}

// Helper to determine if someone is a spouse based on relationship
const isSpouse = (relationship: string): boolean => {
  const rel = relationship.toLowerCase();
  return (
    rel.includes("spouse") ||
    rel.includes("wife") ||
    rel.includes("husband") ||
    rel.includes("partner")
  );
};

// Helper to determine if someone is self/deceased
const isSelf = (relationship: string): boolean => {
  const rel = relationship.toLowerCase();
  return rel.includes("self") || rel.includes("deceased");
};

// Helper to determine if someone is a grandchild
const isGrandchild = (relationship: string): boolean => {
  const rel = relationship.toLowerCase();
  return rel.includes("grand");
};

const FamilyTree = () => {
  const { sectionsData, memorial } = useTemplate();

  // Get family tree data from sectionsData
  const familyTreeData = (sectionsData?.FAMILY_TREE || {}) as Record<string, unknown>;

  // Section title and subtitle
  const sectionTitle = (familyTreeData.title as string) || "Family Tree";
  const sectionSubtitle =
    (familyTreeData.subtitle as string) || "A legacy of love that lives on through generations";
  const quote = (familyTreeData.quote as string) || "A family's love is life's greatest blessing";

  // Get user-provided members
  const userMembers = familyTreeData.members as FamilyMember[] | undefined;
  const hasUserMembers =
    userMembers &&
    Array.isArray(userMembers) &&
    userMembers.length > 0 &&
    userMembers.some((m) => m.name);

  // If no user members, show placeholder
  if (!hasUserMembers) {
    return (
      <section id="family" className="relative py-20 px-4 text-white overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764852092/family_pzt4mm.png)`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/90 via-[#2e3a25] to-[#1f2615]/90 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

        <div className="relative container mx-auto max-w-6xl z-10">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4">
              <Users className="w-8 h-8 text-amber-200" />
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-amber-100">
                {sectionTitle}
              </h2>
            </div>
            <p className="font-body text-amber-50/80 text-lg">{sectionSubtitle}</p>
          </div>

          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-12 border border-white/15 text-center">
            <Heart className="mx-auto mb-4 h-16 w-16 text-amber-200/40" />
            <p className="text-lg text-amber-100/60">Family members will appear here</p>
            <p className="mt-2 text-sm text-amber-200/40">
              Add family members in the page builder to display them
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Transform user members into the format needed for display
  // Find the deceased (self) and spouse from members
  const selfMember = userMembers.find((m) => isSelf(m.relationship || m.relation || ""));
  const spouseMember = userMembers.find((m) => isSpouse(m.relationship || m.relation || ""));

  // Get children (non-spouse, non-self, non-grandchild)
  const childMembers = userMembers.filter((m) => {
    const rel = m.relationship || m.relation || "";
    return !isSelf(rel) && !isSpouse(rel) && !isGrandchild(rel);
  });

  // Get grandchildren
  const grandchildMembers = userMembers.filter((m) =>
    isGrandchild(m.relationship || m.relation || "")
  );

  // Build family data structure
  const familyData: FamilyData = {
    name: selfMember?.name || memorial?.name || "In Loving Memory",
    photo: selfMember?.photo || selfMember?.image || memorial?.portraitUrl || PLACEHOLDER_IMAGE,
    spouse: spouseMember
      ? {
          name: spouseMember.name,
          photo: spouseMember.photo || spouseMember.image || PLACEHOLDER_IMAGE,
        }
      : undefined,
    children: childMembers.map((child, index) => ({
      id: child.id || index,
      name: child.name,
      photo: child.photo || child.image || PLACEHOLDER_IMAGE,
      relation: child.relationship || child.relation || "Child",
      // Attach grandchildren to first child for now (can be enhanced later)
      grandchildren:
        index === 0
          ? grandchildMembers.map((gc, gcIndex) => ({
              id: gc.id || `gc-${gcIndex}`,
              name: gc.name,
              photo: gc.photo || gc.image || PLACEHOLDER_IMAGE,
              relation: gc.relationship || gc.relation || "Grandchild",
            }))
          : [],
    })),
    quote,
  };

  return (
    <section id="family" className="relative py-20 px-4 text-white overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dxoorukfj/image/upload/v1764852092/family_pzt4mm.png)`,
        }}
      ></div>

      {/* Light green gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f]/90 via-[#2e3a25] to-[#1f2615]/90 z-0"></div>

      {/* Enhanced soft light overlay for sunlight glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(252, 228, 181, 0.15),transparent_60%)] pointer-events-none z-0"></div>

      {/* Additional gradient for smoother transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none z-0"></div>

      {/* Optional texture overlay for depth */}
      <div className="absolute inset-0 bg-[url('/textures/forest-light.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <div className="relative container mx-auto max-w-6xl z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <Users className="w-8 h-8 text-amber-200" />
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-amber-100">
              {sectionTitle}
            </h2>
          </div>
          <p className="font-body text-amber-50/80 text-lg">{sectionSubtitle}</p>
        </div>

        {/* Root - Deceased Person & Spouse */}
        <div className="flex flex-col items-center mb-16 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-8">
            {/* Deceased Person */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full animate-glow-pulse" />
                <Image
                  src={familyData.photo || PLACEHOLDER_IMAGE}
                  alt={familyData.name || "Family member"}
                  className="relative w-60 h-60 rounded-full object-cover border-4 border-amber-300/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  width={240}
                  height={240}
                />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mt-4 text-amber-100">
                {familyData.name}
              </h3>
              <p className="font-body text-amber-200/70 italic">In Loving Memory</p>
            </div>

            {/* Spouse */}
            {familyData.spouse && familyData.spouse.name && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/10 blur-xl rounded-full" />
                  <Image
                    src={familyData.spouse.photo || PLACEHOLDER_IMAGE}
                    alt={familyData.spouse.name || "Spouse"}
                    className="relative w-48 h-48 rounded-full object-cover border-4 border-amber-200/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                    width={192}
                    height={192}
                  />
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold mt-4 text-amber-100">
                  {familyData.spouse.name}
                </h3>
                <p className="font-body text-amber-200/70 italic">Beloved Spouse</p>
              </div>
            )}
          </div>

          {/* Heart connector between spouses */}
          {familyData.spouse && familyData.spouse.name && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-0.5 bg-gradient-to-r from-amber-300/50 to-transparent"></div>
              <div className="text-2xl text-amber-300/60">❤</div>
              <div className="w-12 h-0.5 bg-gradient-to-l from-amber-300/50 to-transparent"></div>
            </div>
          )}
        </div>

        {/* Connector Line to Children */}
        <div className="flex justify-center mb-8">
          <div className="w-0.5 h-12 bg-gradient-to-b from-amber-300/50 to-transparent" />
        </div>

        {/* Children Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {familyData.children.map((child, index) => (
            <div
              key={child.id}
              className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.2)] animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Child */}
              <div className="flex flex-col items-center mb-6">
                <Image
                  src={child.photo || PLACEHOLDER_IMAGE}
                  alt={child.name || "Family member"}
                  className="w-48 h-48 rounded-full object-cover border-3 border-amber-300/30 shadow-soft mb-3"
                  width={192}
                  height={192}
                />
                <h4 className="font-heading text-xl font-semibold text-amber-100 text-center">
                  {child.name}
                </h4>
                <p className="font-body text-sm text-amber-200/70">{child.relation || "Child"}</p>
              </div>

              {/* Grandchildren */}
              {child.grandchildren && child.grandchildren.length > 0 && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-amber-300/30 to-transparent" />
                  </div>
                  <div className="space-y-3">
                    {child.grandchildren.map((grandchild) => (
                      <div
                        key={grandchild.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10"
                      >
                        <Image
                          src={grandchild.photo || PLACEHOLDER_IMAGE}
                          alt={grandchild.name || "Grandchild"}
                          width={128}
                          height={128}
                          className="w-32 h-32 rounded-full object-cover border-2 border-amber-300/20"
                        />
                        <div>
                          <p className="font-body font-medium text-amber-100 text-sm">
                            {grandchild.name}
                          </p>
                          <p className="font-body text-xs text-amber-200/60">Grandchild</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-block backdrop-blur-md bg-white/10 rounded-2xl px-8 py-4 border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <p className="font-body text-amber-100/80 italic">&ldquo;{familyData.quote}&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FamilyTree;
