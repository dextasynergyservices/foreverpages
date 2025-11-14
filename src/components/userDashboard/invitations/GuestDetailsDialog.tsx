import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Badge } from "@/components/ui/badge";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdRestaurant,
  MdAccessible,
  MdPeople,
  MdNoteAlt,
  MdClose,
} from "react-icons/md";
import { Invitation } from "./Invitations";

interface GuestDetailsDialogProps {
  invitation: Invitation | null;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedInvitation: Partial<Invitation>) => void;
  readOnly?: boolean;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const GuestDetailsDialog: React.FC<GuestDetailsDialogProps> = ({
  invitation,
  open,
  onClose,
  onSave,
  readOnly = false,
  t,
}) => {
  const [plusOnes, setPlusOnes] = useState(invitation?.plusOnes?.toString() || "0");
  const [dietaryRestrictions, setDietaryRestrictions] = useState(
    invitation?.dietaryRestrictions || ""
  );
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(
    invitation?.accessibilityNeeds || ""
  );
  const [specialRequests, setSpecialRequests] = useState(invitation?.specialRequests || "");

  // Update state when invitation changes
  React.useEffect(() => {
    if (invitation) {
      setPlusOnes(invitation.plusOnes?.toString() || "0");
      setDietaryRestrictions(invitation.dietaryRestrictions || "");
      setAccessibilityNeeds(invitation.accessibilityNeeds || "");
      setSpecialRequests(invitation.specialRequests || "");
    }
  }, [invitation]);

  const handleSave = () => {
    if (onSave && invitation) {
      onSave({
        id: invitation.id,
        plusOnes: parseInt(plusOnes) || 0,
        dietaryRestrictions: dietaryRestrictions.trim(),
        accessibilityNeeds: accessibilityNeeds.trim(),
        specialRequests: specialRequests.trim(),
      });
    }
    onClose();
  };

  if (!invitation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MdPerson className="h-5 w-5" />
            {t("dashboard.invitations.guestDetails.title", {}, "Guest Details")}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? t(
                  "dashboard.invitations.guestDetails.viewDescription",
                  {},
                  "View detailed information for this guest"
                )
              : t(
                  "dashboard.invitations.guestDetails.editDescription",
                  {},
                  "View and edit detailed information for this guest"
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              {t(
                "dashboard.invitations.guestList.guestDetailsDialog.basicInfo",
                {},
                "Basic Information"
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                <MdPerson className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.invitations.guestList.guestDetailsDialog.name", {}, "Name")}
                  </p>
                  <p className="font-medium text-foreground">{invitation.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                <MdEmail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.invitations.guestList.guestDetailsDialog.email", {}, "Email")}
                  </p>
                  <p className="font-medium text-sm truncate text-foreground">{invitation.email}</p>
                </div>
              </div>
              {invitation.phone && (
                <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                  <MdPhone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.invitations.guestList.guestDetailsDialog.phone", {}, "Phone")}
                    </p>
                    <p className="font-medium text-foreground">{invitation.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "dashboard.invitations.guestList.guestDetailsDialog.rsvpStatus",
                      {},
                      "RSVP Status"
                    )}
                  </p>
                  <Badge variant={invitation.rsvp === "yes" ? "default" : "secondary"}>
                    {invitation.rsvp ||
                      t("dashboard.invitations.guestList.table.noResponse", {}, "No Response")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Management Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              {t(
                "dashboard.invitations.guestList.guestDetailsDialog.guestInfo",
                {},
                "Guest Information"
              )}
            </h3>

            {/* Plus Ones */}
            <div>
              <Label htmlFor="plusOnes" className="flex items-center gap-2 text-foreground">
                <MdPeople className="h-4 w-4" />
                {t(
                  "dashboard.invitations.guestList.guestDetailsDialog.plusOnesLabel",
                  {},
                  "Additional Guests (+1s)"
                )}
              </Label>
              {readOnly ? (
                <div className="mt-2 p-3 bg-accent/30 rounded-lg">
                  <p className="text-lg font-semibold text-foreground">
                    {plusOnes || "0"}{" "}
                    {parseInt(plusOnes) === 1
                      ? t(
                          "dashboard.invitations.guestList.guestDetailsDialog.plusOnesSingular",
                          {},
                          "guest"
                        )
                      : t(
                          "dashboard.invitations.guestList.guestDetailsDialog.plusOnesPlural",
                          {},
                          "guests"
                        )}
                  </p>
                </div>
              ) : (
                <>
                  <Input
                    id="plusOnes"
                    type="number"
                    min="0"
                    max="10"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      "dashboard.invitations.guestList.guestDetailsDialog.plusOnesHelp",
                      {},
                      "Number of additional guests attending"
                    )}
                  </p>
                </>
              )}
            </div>

            {/* Dietary Restrictions */}
            <div>
              <Label
                htmlFor="dietaryRestrictions"
                className="flex items-center gap-2 text-foreground"
              >
                <MdRestaurant className="h-4 w-4" />
                {t(
                  "dashboard.invitations.guestList.guestDetailsDialog.dietaryLabel",
                  {},
                  "Dietary Restrictions/Preferences"
                )}
              </Label>
              {readOnly ? (
                <div className="mt-2 p-3 bg-accent/30 rounded-lg min-h-[80px]">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {dietaryRestrictions ||
                      t(
                        "dashboard.invitations.guestList.guestDetailsDialog.dietaryEmpty",
                        {},
                        "No dietary restrictions specified"
                      )}
                  </p>
                </div>
              ) : (
                <Textarea
                  id="dietaryRestrictions"
                  value={dietaryRestrictions}
                  onChange={(e) => setDietaryRestrictions(e.target.value)}
                  placeholder={t(
                    "dashboard.invitations.guestList.guestDetailsDialog.dietaryPlaceholder",
                    {},
                    "e.g., Vegetarian, Vegan, Gluten-free, Allergies..."
                  )}
                  className="mt-2"
                  rows={3}
                />
              )}
            </div>

            {/* Accessibility Needs */}
            <div>
              <Label
                htmlFor="accessibilityNeeds"
                className="flex items-center gap-2 text-foreground"
              >
                <MdAccessible className="h-4 w-4" />
                {t(
                  "dashboard.invitations.guestList.guestDetailsDialog.accessibilityLabel",
                  {},
                  "Accessibility Needs"
                )}
              </Label>
              {readOnly ? (
                <div className="mt-2 p-3 bg-accent/30 rounded-lg min-h-[80px]">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {accessibilityNeeds ||
                      t(
                        "dashboard.invitations.guestList.guestDetailsDialog.accessibilityEmpty",
                        {},
                        "No accessibility needs specified"
                      )}
                  </p>
                </div>
              ) : (
                <Textarea
                  id="accessibilityNeeds"
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  placeholder={t(
                    "dashboard.invitations.guestList.guestDetailsDialog.accessibilityPlaceholder",
                    {},
                    "e.g., Wheelchair access, Sign language interpreter, Large print materials..."
                  )}
                  className="mt-2"
                  rows={3}
                />
              )}
            </div>

            {/* Special Requests */}
            <div>
              <Label htmlFor="specialRequests" className="flex items-center gap-2 text-foreground">
                <MdNoteAlt className="h-4 w-4" />
                {t(
                  "dashboard.invitations.guestList.guestDetailsDialog.specialLabel",
                  {},
                  "Special Requests/Notes"
                )}
              </Label>
              {readOnly ? (
                <div className="mt-2 p-3 bg-accent/30 rounded-lg min-h-[80px]">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {specialRequests ||
                      t(
                        "dashboard.invitations.guestList.guestDetailsDialog.specialEmpty",
                        {},
                        "No special requests"
                      )}
                  </p>
                </div>
              ) : (
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder={t(
                    "dashboard.invitations.guestList.guestDetailsDialog.specialPlaceholder",
                    {},
                    "Any other special requests or notes..."
                  )}
                  className="mt-2"
                  rows={3}
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-foreground border-foreground/20 hover:bg-accent"
          >
            <MdClose className="h-4 w-4 mr-2" />
            {readOnly
              ? t("dashboard.invitations.guestList.guestDetailsDialog.close", {}, "Close")
              : t("dashboard.invitations.guestList.guestDetailsDialog.cancel", {}, "Cancel")}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} variant="default">
              {t("dashboard.invitations.guestList.guestDetailsDialog.save", {}, "Save Changes")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
