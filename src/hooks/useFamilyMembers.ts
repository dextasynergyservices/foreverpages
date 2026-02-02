"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FamilyMember, FamilyRelationship } from "@/generated/prisma";

export interface FamilyMemberData {
  firstName: string;
  lastName: string;
  relationship: FamilyRelationship;
  isDeceased?: boolean;
  birthYear?: number | null;
  deathYear?: number | null;
  photo?: string | null;
  bio?: string | null;
}

interface FamilyMembersResponse {
  success: boolean;
  data: FamilyMember[];
  error?: string;
}

interface FamilyMemberResponse {
  success: boolean;
  data: FamilyMember;
  error?: string;
}

/**
 * Fetch family members for a memorial
 */
async function fetchFamilyMembers(memorialId: string): Promise<FamilyMember[]> {
  const response = await fetch(`/api/memorial/${memorialId}/family`);
  const result: FamilyMembersResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to fetch family members");
  }

  return result.data;
}

/**
 * Create a new family member
 */
async function createFamilyMember(
  memorialId: string,
  data: FamilyMemberData
): Promise<FamilyMember> {
  const response = await fetch(`/api/memorial/${memorialId}/family`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result: FamilyMemberResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to create family member");
  }

  return result.data;
}

/**
 * Update a family member
 */
async function updateFamilyMember(
  memorialId: string,
  memberId: string,
  data: Partial<FamilyMemberData>
): Promise<FamilyMember> {
  const response = await fetch(`/api/memorial/${memorialId}/family?memberId=${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result: FamilyMemberResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to update family member");
  }

  return result.data;
}

/**
 * Delete a family member
 */
async function deleteFamilyMember(memorialId: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/memorial/${memorialId}/family?memberId=${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Failed to delete family member");
  }
}

/**
 * Hook to fetch family members for a memorial
 */
export function useFamilyMembers(memorialId: string | null | undefined) {
  return useQuery({
    queryKey: ["familyMembers", memorialId],
    queryFn: () => fetchFamilyMembers(memorialId!),
    enabled: !!memorialId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new family member
 */
export function useCreateFamilyMember(memorialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FamilyMemberData) => createFamilyMember(memorialId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers", memorialId] });
    },
  });
}

/**
 * Hook to update a family member
 */
export function useUpdateFamilyMember(memorialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: Partial<FamilyMemberData> }) =>
      updateFamilyMember(memorialId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers", memorialId] });
    },
  });
}

/**
 * Hook to delete a family member
 */
export function useDeleteFamilyMember(memorialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => deleteFamilyMember(memorialId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers", memorialId] });
    },
  });
}

/**
 * Get relationship display name
 */
export function getRelationshipLabel(
  relationship: FamilyRelationship,
  t?: (key: string) => string
): string {
  const labels: Record<FamilyRelationship, string> = {
    SPOUSE: t ? t("relationships.spouse") : "Spouse",
    PARTNER: t ? t("relationships.partner") : "Partner",
    FATHER: t ? t("relationships.father") : "Father",
    MOTHER: t ? t("relationships.mother") : "Mother",
    SON: t ? t("relationships.son") : "Son",
    DAUGHTER: t ? t("relationships.daughter") : "Daughter",
    BROTHER: t ? t("relationships.brother") : "Brother",
    SISTER: t ? t("relationships.sister") : "Sister",
    GRANDFATHER: t ? t("relationships.grandfather") : "Grandfather",
    GRANDMOTHER: t ? t("relationships.grandmother") : "Grandmother",
    GRANDSON: t ? t("relationships.grandson") : "Grandson",
    GRANDDAUGHTER: t ? t("relationships.granddaughter") : "Granddaughter",
    UNCLE: t ? t("relationships.uncle") : "Uncle",
    AUNT: t ? t("relationships.aunt") : "Aunt",
    NEPHEW: t ? t("relationships.nephew") : "Nephew",
    NIECE: t ? t("relationships.niece") : "Niece",
    COUSIN: t ? t("relationships.cousin") : "Cousin",
    OTHER: t ? t("relationships.other") : "Other",
  };

  return labels[relationship] || relationship;
}

/**
 * Group family members by relationship type
 */
export function groupFamilyMembersByRelationship(
  members: FamilyMember[]
): Record<string, FamilyMember[]> {
  const groups: Record<string, FamilyMember[]> = {};

  // Define relationship order for grouping
  const relationshipOrder = [
    "SPOUSE",
    "PARTNER",
    "FATHER",
    "MOTHER",
    "SON",
    "DAUGHTER",
    "BROTHER",
    "SISTER",
    "GRANDFATHER",
    "GRANDMOTHER",
    "GRANDSON",
    "GRANDDAUGHTER",
    "UNCLE",
    "AUNT",
    "NEPHEW",
    "NIECE",
    "COUSIN",
    "OTHER",
  ];

  // Initialize groups in order
  relationshipOrder.forEach((rel) => {
    const membersWithRelationship = members.filter((m) => m.relationship === rel);
    if (membersWithRelationship.length > 0) {
      groups[rel] = membersWithRelationship;
    }
  });

  return groups;
}
