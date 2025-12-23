"use client";

import { Heart } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

export const FamilyTree = () => {
  const { sectionsData } = useTemplate();

  // Get FAMILY_TREE section data with fallbacks
  const familyData = (sectionsData?.FAMILY_TREE as any) || {};
  const defaultFamilyMembers = [
    {
      name: "Eleanor Thompson",
      relation: "Self",
      level: 0,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764670890/recent_h90dne.png",
    },
    {
      name: "Robert Thompson",
      relation: "Spouse",
      level: 0,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689692/husband_zlck3i.png",
    },
    {
      name: "Victor Thompson",
      relation: "First Son",
      level: 1,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689692/first-son_rmc6dh.png",
    },
    {
      name: "Michael Thompson",
      relation: "Second Son",
      level: 1,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689691/second-son_hvq3l4.png",
    },
    {
      name: "Jennifer Davis",
    },
    {
      name: "Jennifer Davis",
      relation: "Daughter",
      level: 1,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689689/daugter_gmzdqr.png",
    },
    {
      name: "Emily Johnson",
      relation: "Granddaughter",
      level: 2,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689689/grandchild1_xtoehd.png",
    },
    {
      name: "David Johnson",
      relation: "Grandson",
      level: 2,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689691/grandchild3_gmsvcz.png",
    },
    {
      name: "Grace Thompson",
      relation: "Granddaughter",
      level: 2,
      image: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764689691/grandchild2_ttqmc1.png",
    },
  ];

  const familyMembers = familyData.members || defaultFamilyMembers;

  return (
    <section className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            Our Family Circle
          </h2>
          <div className="mx-auto h-1 w-32 rounded-full bg-soft-gold" />
          <p className="mt-6 text-lg text-cream/80">
            A legacy of love that continues through generations
          </p>
        </div>

        <div className="rounded-2xl border border-cream/20 bg-cream/10 p-8 shadow-elegant backdrop-blur-sm md:p-12">
          {/* Generation 1 - Eleanor & Robert */}
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
                  <h3 className="font-heading text-lg font-semibold text-cream">{member.name}</h3>
                  <p className="text-sm text-cream/80">{member.relation}</p>
                </div>
              ))}
          </div>

          {/* Connecting Line */}
          <div className="mb-8 flex justify-center">
            <div className="h-12 w-1 bg-soft-gold/50" />
          </div>

          {/* Generation 2 - Children */}
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
          <div className="mb-8 flex justify-center">
            <div className="h-12 w-1 bg-soft-gold/50" />
          </div>

          {/* Generation 3 - Grandchildren */}
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
        </div>
      </div>
    </section>
  );
};
