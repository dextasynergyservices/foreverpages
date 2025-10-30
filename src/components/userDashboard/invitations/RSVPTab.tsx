import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RSVPStats } from "./RSVPStats";
import { Invitation } from "./Invitations";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface RSVPTabProps {
  invitations: Invitation[];
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const RSVPTab: React.FC<RSVPTabProps> = ({ invitations, themeClasses, t }) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;

  const getRSVPColor = (rsvp: Invitation["rsvp"]) => {
    switch (rsvp) {
      case "yes":
        return "default";
      case "no":
        return "destructive";
      case "maybe":
        return "secondary";
      default:
        return "outline";
    }
  };

  const rsvpInvitations = invitations.filter((inv) => inv.rsvp);

  return (
    <>
      <RSVPStats themeClasses={themeClasses} t={t} />

      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle>{t("dashboard.invitations.rsvp.responsesTitle")}</CardTitle>
          <CardDescription className={textMuted}>
            {t("dashboard.invitations.rsvp.responsesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rsvpInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${cardBorder}`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{invitation.name}</p>
                    <p className={`text-sm ${textMuted}`}>{invitation.email}</p>
                  </div>
                  <Badge variant={getRSVPColor(invitation.rsvp)}>
                    {invitation.rsvp === "yes"
                      ? "Attending"
                      : invitation.rsvp === "no"
                        ? "Cannot Attend"
                        : "Maybe"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
