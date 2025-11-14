import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MdRefresh, MdDelete, MdEmail, MdPhone } from "react-icons/md";
import { Invitation } from "./Invitations";
import { formatDistanceToNow, isPast, differenceInHours } from "date-fns";

interface InvitationListProps {
  invitations: Invitation[];
  onRemoveInvitation: (id: string) => void;
  onResendInvitation: (id: string) => void;
  theme: string;
  cardBorder: string;
  textMuted: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  isResending?: boolean;
  isDeleting?: boolean;
  // Bulk selection props
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
  onToggleAll?: () => void;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  invitations,
  onRemoveInvitation,
  onResendInvitation,
  theme,
  cardBorder,
  textMuted,
  t,
  isResending = false,
  isDeleting = false,
  selectionMode = false,
  selectedIds = [],
  onToggleSelection,
  onToggleAll,
}) => {
  const allSelected =
    selectionMode &&
    invitations.length > 0 &&
    invitations.every((inv) => selectedIds.includes(inv.id));
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

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const hoursUntilExpiry = differenceInHours(new Date(expiresAt), new Date());
    return hoursUntilExpiry > 0 && hoursUntilExpiry < 48; // Less than 48 hours
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return isPast(new Date(expiresAt));
  };

  return (
    <div className="space-y-4">
      {/* Select All Header (only in selection mode) */}
      {selectionMode && invitations.length > 0 && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/30">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleAll}
            aria-label="Select all invitations"
          />
          <span className="text-sm font-medium">
            {allSelected ? "Deselect All" : "Select All"} ({invitations.length} invitation
            {invitations.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {invitations.map((invitation) => {
        const expiringSoon = isExpiringSoon(invitation.expiresAt);
        const expired = isExpired(invitation.expiresAt);
        const isSelected = selectedIds.includes(invitation.id);

        return (
          <div
            key={invitation.id}
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg ${cardBorder} ${expired ? "opacity-60" : ""} ${isSelected && selectionMode ? "ring-2 ring-primary" : ""}`}
          >
            {/* Checkbox (only in selection mode) */}
            {selectionMode && (
              <div className="mr-3 mb-3 sm:mb-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection?.(invitation.id)}
                  aria-label={`Select ${invitation.name}`}
                />
              </div>
            )}

            <div className="flex-1 mb-3 sm:mb-0">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <p className="font-medium">{invitation.name}</p>
                    <p className={`text-sm ${textMuted}`}>{invitation.email}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getStatusColor(invitation.status)}>{invitation.status}</Badge>
                    {invitation.rsvp && (
                      <Badge variant={getRSVPColor(invitation.rsvp)}>RSVP: {invitation.rsvp}</Badge>
                    )}
                    {expired && <Badge variant="destructive">Expired</Badge>}
                    {expiringSoon && !expired && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Show delivery channels and expiration */}
                <div className="flex gap-3 items-center text-xs">
                  {invitation.sentViaEmail && (
                    <span className={`flex items-center gap-1 ${textMuted}`}>
                      <MdEmail className="h-3 w-3" />
                      Email
                    </span>
                  )}
                  {invitation.sentViaWhatsApp && (
                    <span className={`flex items-center gap-1 ${textMuted}`}>
                      <MdPhone className="h-3 w-3" />
                      WhatsApp
                    </span>
                  )}
                  {invitation.expiresAt && (
                    <span
                      className={`${textMuted} ${expiringSoon ? "text-yellow-600" : ""} ${expired ? "text-red-600" : ""}`}
                    >
                      {expired
                        ? `Expired ${formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}`
                        : `Expires ${formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "dark" ? "memorial-ghost" : "outline"}
                size="sm"
                onClick={() => onResendInvitation(invitation.id)}
                disabled={isResending || isDeleting}
              >
                <MdRefresh className="h-4 w-4 mr-1" />
                {isResending
                  ? t("dashboard.invitations.actions.resending", {}, "Resending...")
                  : t("dashboard.invitations.actions.resend")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveInvitation(invitation.id)}
                disabled={isResending || isDeleting}
              >
                <MdDelete className="h-4 w-4 mr-1" />
                {t("dashboard.invitations.actions.remove")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
