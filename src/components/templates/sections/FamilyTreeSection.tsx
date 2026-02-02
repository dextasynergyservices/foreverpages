"use client";

import React from "react";
import Image from "next/image";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";
import {
  useFamilyMembers,
  getRelationshipLabel,
  groupFamilyMembersByRelationship,
} from "@/hooks/useFamilyMembers";
import { Users, Loader2 } from "lucide-react";

interface FamilyTreeSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const FamilyTreeSection: React.FC<FamilyTreeSectionProps> = ({
  memorial,
  layout = "grid",
}) => {
  const { t } = useTranslations();
  const { data: familyMembers, isLoading, error } = useFamilyMembers(memorial.id);

  const sectionStyle: React.CSSProperties = {
    paddingTop: "var(--spacing, 3rem)",
    paddingBottom: "var(--spacing, 3rem)",
    backgroundColor: "var(--color-body-bg, #f3f4f6)",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
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

  const contentBoxStyle: React.CSSProperties = {
    backgroundColor: "var(--color-header-bg, white)",
    borderRadius: "var(--border-radius, 0.5rem)",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    padding: "2rem",
  };

  const groupTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-body-size, 1.125rem)",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "var(--color-header-text, #374151)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const memberCardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-body-bg, #f9fafb)",
    borderRadius: "var(--border-radius, 0.5rem)",
    padding: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  };

  const avatarStyle: React.CSSProperties = {
    width: "3.5rem",
    height: "3.5rem",
    borderRadius: "50%",
    backgroundColor: "var(--color-primary, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "600",
    fontSize: "1.25rem",
    flexShrink: 0,
    overflow: "hidden",
  };

  const memberNameStyle: React.CSSProperties = {
    fontWeight: "600",
    color: "var(--color-header-text, #1f2937)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    fontSize: "var(--font-body-size, 1rem)",
  };

  const memberYearsStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-body-text, #6b7280)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const memberBioStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--color-body-text, #6b7280)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
    marginTop: "0.25rem",
    lineHeight: "1.5",
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "3rem",
    color: "var(--color-body-text, #6b7280)",
  };

  // Show loading state
  if (isLoading) {
    return (
      <section style={sectionStyle}>
        <div style={containerStyle}>
          <h2 style={titleStyle}>
            {t("dashboard.pageBuilder.templates.content.familyTree.title", {}, "Family")}
          </h2>
          <div style={contentBoxStyle}>
            <div style={loadingStyle}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if error or no family members
  if (error || !familyMembers || familyMembers.length === 0) {
    return null;
  }

  // Group family members by relationship
  const groupedMembers = groupFamilyMembersByRelationship(familyMembers);
  const groups = Object.entries(groupedMembers);

  if (groups.length === 0) return null;

  const getGridStyle = (): React.CSSProperties => {
    if (layout === "list") {
      return {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      };
    }
    return {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "0.75rem",
    };
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatYears = (birthYear?: number | null, deathYear?: number | null): string | null => {
    if (birthYear && deathYear) {
      return `${birthYear} - ${deathYear}`;
    }
    if (birthYear) {
      return `${t("familyTree.born", {}, "Born")} ${birthYear}`;
    }
    if (deathYear) {
      return `${t("familyTree.passed", {}, "Passed")} ${deathYear}`;
    }
    return null;
  };

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>
          {t("dashboard.pageBuilder.templates.content.familyTree.title", {}, "Family")}
        </h2>
        <div style={contentBoxStyle}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {groups.map(([relationship, members]) => (
              <div key={relationship}>
                <h3 style={groupTitleStyle}>
                  <Users size={18} />
                  {getRelationshipLabel(
                    relationship as unknown as import("@/generated/prisma").FamilyRelationship,
                    (key) => t(key, {}, key.split(".").pop() || key)
                  )}
                  {members.length > 1 && (
                    <span
                      style={{ fontWeight: "normal", color: "var(--color-body-text, #6b7280)" }}
                    >
                      ({members.length})
                    </span>
                  )}
                </h3>
                <div style={getGridStyle()}>
                  {members.map((member) => {
                    const years = formatYears(member.birthYear, member.deathYear);
                    return (
                      <div key={member.id} style={memberCardStyle}>
                        <div style={avatarStyle}>
                          {member.photo ? (
                            <Image
                              src={member.photo}
                              alt={`${member.firstName} ${member.lastName}`}
                              width={56}
                              height={56}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            getInitials(member.firstName, member.lastName)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={memberNameStyle}>
                            {member.firstName} {member.lastName}
                            {member.isDeceased && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "normal",
                                  color: "var(--color-body-text, #6b7280)",
                                  marginLeft: "0.5rem",
                                }}
                              >
                                ({t("familyTree.deceased", {}, "Deceased")})
                              </span>
                            )}
                          </div>
                          {years && <div style={memberYearsStyle}>{years}</div>}
                          {member.bio && (
                            <div style={memberBioStyle} title={member.bio}>
                              {member.bio.length > 100
                                ? `${member.bio.substring(0, 100)}...`
                                : member.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
