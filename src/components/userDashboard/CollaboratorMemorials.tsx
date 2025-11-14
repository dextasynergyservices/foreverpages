"use client";

import React, { useEffect, useState } from "react";
import { Users, ExternalLink, Calendar, Shield } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface InvitedMemorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  coverPhoto?: string;
  birthDate: string;
  deathDate: string;
  collaboratorRole: string;
  invitationId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export function CollaboratorMemorials() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [invitedMemorials, setInvitedMemorials] = useState<InvitedMemorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvitedMemorials() {
      try {
        const response = await fetch("/api/memorials/invited");
        if (response.ok) {
          const data = await response.json();
          setInvitedMemorials(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch invited memorials:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvitedMemorials();
  }, []);

  if (loading) {
    return (
      <Card className={theme === "dark" ? "bg-black border-white/10" : "bg-white"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("dashboard.collaboratorMemorials.title", {}, "Memorials You're Helping Manage")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitedMemorials.length === 0) {
    return null; // Don't show if no invited memorials
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-purple-500",
      EDITOR: "bg-blue-500",
      CONTRIBUTOR: "bg-green-500",
      VIEWER: "bg-gray-500",
    };
    return colors[role] || "bg-gray-500";
  };

  return (
    <Card className={theme === "dark" ? "bg-black border-white/10" : "bg-white"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("dashboard.collaboratorMemorials.title", {}, "Memorials You're Helping Manage")}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            "dashboard.collaboratorMemorials.subtitle",
            {},
            "You've been invited to collaborate on these memorials"
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitedMemorials.map((memorial) => {
            const memorialImage =
              memorial.coverPhoto || memorial.profilePhoto || "/default-memorial.jpg";

            return (
              <div
                key={memorial.id}
                className={`border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200"
                }`}
              >
                <div className="flex gap-4 p-4">
                  {/* Memorial Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={memorialImage}
                      alt={`${memorial.firstName} ${memorial.lastName}`}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Memorial Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {memorial.firstName} {memorial.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(memorial.birthDate).getFullYear()} -{" "}
                            {new Date(memorial.deathDate).getFullYear()}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`${getRoleBadgeColor(memorial.collaboratorRole)} text-white`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {memorial.collaboratorRole}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t(
                        "dashboard.collaboratorMemorials.ownedBy",
                        { owner: memorial.owner.name },
                        `Owned by ${memorial.owner.name}`
                      )}
                    </p>

                    <Link href={`/memorial-pages/${memorial.slug}`}>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t("dashboard.collaboratorMemorials.manageMemorial", {}, "Manage Memorial")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
