import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Invitation } from "./Invitations";

interface InvitationListProps {
  invitations: Invitation[];
  onRemoveInvitation: (id: number) => void;
  onResendInvitation: (id: number) => void;
  theme: string;
  cardBorder: string;
  textMuted: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  invitations,
  onRemoveInvitation,
  onResendInvitation,
  theme,
  cardBorder,
  textMuted,
  t,
}) => {
  const getStatusColor = (status: Invitation["status"]) => {
    switch (status) {
      case "sent":
        return "default";
      case "pending":
        return "secondary";
      case "delivered":
        return "default";
      default:
        return "outline";
    }
  };

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

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg ${cardBorder}`}
        >
          <div className="flex-1 mb-3 sm:mb-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <p className="font-medium">{invitation.name}</p>
                <p className={`text-sm ${textMuted}`}>{invitation.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusColor(invitation.status)}>{invitation.status}</Badge>
                {invitation.rsvp && (
                  <Badge variant={getRSVPColor(invitation.rsvp)}>RSVP: {invitation.rsvp}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={theme === "dark" ? "memorial-ghost" : "outline"}
              size="sm"
              onClick={() => onResendInvitation(invitation.id)}
            >
              {t("dashboard.invitations.actions.resend")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemoveInvitation(invitation.id)}
            >
              {t("dashboard.invitations.actions.remove")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
