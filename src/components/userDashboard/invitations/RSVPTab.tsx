import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RSVPStats } from "./RSVPStats";
import { Invitation } from "./Invitations";
import {
  MdCheckCircle,
  MdCancel,
  MdHelp,
  MdPending,
  MdEmail,
  MdPhone,
  MdPerson,
} from "react-icons/md";
import { useTranslations } from "@/hooks/useTranslations";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface RSVPTabProps {
  invitations: Invitation[];
  theme: string;
  themeClasses: ThemeClasses;
}

type FilterType = "all" | "yes" | "no" | "maybe" | "pending";

export const RSVPTab: React.FC<RSVPTabProps> = ({ invitations, theme, themeClasses }) => {
  const { t } = useTranslations();
  const { cardBorder, cardBg, textMuted } = themeClasses;
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredInvitations = useMemo(() => {
    if (activeFilter === "all") return invitations;
    if (activeFilter === "pending") return invitations.filter((inv) => !inv.rsvp);
    return invitations.filter((inv) => inv.rsvp === activeFilter);
  }, [invitations, activeFilter]);

  const getFilterCount = (filter: FilterType): number => {
    if (filter === "all") return invitations.length;
    if (filter === "pending") return invitations.filter((inv) => !inv.rsvp).length;
    return invitations.filter((inv) => inv.rsvp === filter).length;
  };

  const getRSVPIcon = (rsvp: Invitation["rsvp"]) => {
    switch (rsvp) {
      case "yes":
        return <MdCheckCircle className="h-5 w-5 text-green-600" />;
      case "no":
        return <MdCancel className="h-5 w-5 text-red-600" />;
      case "maybe":
        return <MdHelp className="h-5 w-5 text-yellow-600" />;
      default:
        return <MdPending className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRSVPLabel = (rsvp: Invitation["rsvp"]) => {
    switch (rsvp) {
      case "yes":
        return t("dashboard.invitations.rsvpTab.labels.attending", {}, "Attending");
      case "no":
        return t("dashboard.invitations.rsvpTab.labels.cannotAttend", {}, "Cannot Attend");
      case "maybe":
        return t("dashboard.invitations.rsvpTab.labels.maybe", {}, "Maybe");
      default:
        return t("dashboard.invitations.rsvpTab.labels.noResponse", {}, "No Response");
    }
  };

  const getRSVPBadgeVariant = (rsvp: Invitation["rsvp"]) => {
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

  const FilterButton = ({
    filter,
    label,
    icon: Icon,
  }: {
    filter: FilterType;
    label: string;
    icon: React.ElementType;
  }) => (
    <Button
      variant={activeFilter === filter ? "default" : "outline"}
      size="sm"
      onClick={() => setActiveFilter(filter)}
      className="flex items-center gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
      <Badge variant="secondary" className="ml-1">
        {getFilterCount(filter)}
      </Badge>
    </Button>
  );

  return (
    <>
      <RSVPStats invitations={invitations} themeClasses={themeClasses} theme={theme} />

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterButton
          filter="all"
          label={t("dashboard.invitations.rsvpTab.filters.all", {}, "All")}
          icon={MdPerson}
        />
        <FilterButton
          filter="yes"
          label={t("dashboard.invitations.rsvpTab.filters.attending", {}, "Attending")}
          icon={MdCheckCircle}
        />
        <FilterButton
          filter="no"
          label={t("dashboard.invitations.rsvpTab.filters.declined", {}, "Declined")}
          icon={MdCancel}
        />
        <FilterButton
          filter="maybe"
          label={t("dashboard.invitations.rsvpTab.filters.maybe", {}, "Maybe")}
          icon={MdHelp}
        />
        <FilterButton
          filter="pending"
          label={t("dashboard.invitations.rsvpTab.filters.pending", {}, "Pending")}
          icon={MdPending}
        />
      </div>

      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle>
            {activeFilter === "all"
              ? t("dashboard.invitations.rsvpTab.title.allGuests", {}, "All Guests")
              : t(
                  "dashboard.invitations.rsvpTab.title.guests",
                  { label: getRSVPLabel(activeFilter === "pending" ? null : activeFilter) },
                  `${getRSVPLabel(activeFilter === "pending" ? null : activeFilter)} Guests`
                )}
          </CardTitle>
          <CardDescription className={textMuted}>
            {filteredInvitations.length}{" "}
            {filteredInvitations.length === 1
              ? t("dashboard.invitations.rsvpTab.guestCount.singular", {}, "guest")
              : t("dashboard.invitations.rsvpTab.guestCount.plural", {}, "guests")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <div
                className={`mx-auto w-16 h-16 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} flex items-center justify-center mb-4`}
              >
                <MdPerson className={`h-8 w-8 ${textMuted}`} />
              </div>
              <p className={`text-lg font-medium mb-2`}>
                {t(
                  "dashboard.invitations.rsvpTab.emptyState.noGuests",
                  {
                    filter:
                      activeFilter !== "all" && activeFilter !== "pending"
                        ? getRSVPLabel(activeFilter).toLowerCase()
                        : activeFilter,
                  },
                  `No ${activeFilter !== "all" && activeFilter !== "pending" ? getRSVPLabel(activeFilter).toLowerCase() : activeFilter} guests`
                )}
              </p>
              <p className={textMuted}>
                {activeFilter === "pending"
                  ? t(
                      "dashboard.invitations.rsvpTab.emptyState.allResponded",
                      {},
                      "All guests have responded to their invitations"
                    )
                  : t(
                      "dashboard.invitations.rsvpTab.emptyState.tryDifferentFilter",
                      {},
                      "Try selecting a different filter"
                    )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} ${cardBorder}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon */}
                    <div className="flex-shrink-0">{getRSVPIcon(invitation.rsvp)}</div>

                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{invitation.name || "Anonymous"}</p>
                        <Badge
                          variant={getRSVPBadgeVariant(invitation.rsvp)}
                          className="flex-shrink-0"
                        >
                          {getRSVPLabel(invitation.rsvp)}
                        </Badge>
                      </div>
                      <div className={`flex flex-wrap items-center gap-3 text-sm ${textMuted}`}>
                        {invitation.email && (
                          <span className="flex items-center gap-1">
                            <MdEmail className="h-4 w-4" />
                            {invitation.email}
                          </span>
                        )}
                        {invitation.phone && (
                          <span className="flex items-center gap-1">
                            <MdPhone className="h-4 w-4" />
                            {invitation.phone}
                          </span>
                        )}
                      </div>

                      {/* Guest Details */}
                      {(invitation.plusOnes ||
                        invitation.dietaryRestrictions ||
                        invitation.accessibilityNeeds) && (
                        <div className={`mt-2 text-xs ${textMuted} space-y-1`}>
                          {invitation.plusOnes !== undefined && invitation.plusOnes > 0 && (
                            <div>
                              {t(
                                "dashboard.invitations.rsvpTab.guestDetails.plusOnes",
                                { count: invitation.plusOnes },
                                `Plus ones: ${invitation.plusOnes}`
                              )}
                            </div>
                          )}
                          {invitation.dietaryRestrictions && (
                            <div>
                              {t(
                                "dashboard.invitations.rsvpTab.guestDetails.dietary",
                                { restrictions: invitation.dietaryRestrictions },
                                `Dietary: ${invitation.dietaryRestrictions}`
                              )}
                            </div>
                          )}
                          {invitation.accessibilityNeeds && (
                            <div>
                              {t(
                                "dashboard.invitations.rsvpTab.guestDetails.accessibility",
                                { needs: invitation.accessibilityNeeds },
                                `Accessibility: ${invitation.accessibilityNeeds}`
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
