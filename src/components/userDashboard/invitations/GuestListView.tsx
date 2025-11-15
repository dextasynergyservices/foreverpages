import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MdPeople,
  MdRestaurant,
  MdAccessible,
  MdSearch,
  MdFilterList,
  MdVisibility,
} from "react-icons/md";
import { Invitation } from "./Invitations";
import { GuestDetailsDialog } from "./GuestDetailsDialog";

interface GuestListViewProps {
  invitations: Invitation[];
  themeClasses: {
    cardBorder: string;
    cardBg: string;
    textMuted: string;
  };
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const GuestListView: React.FC<GuestListViewProps> = ({ invitations, themeClasses, t }) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [selectedGuest, setSelectedGuest] = useState<Invitation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter guests
  const filteredGuests = useMemo(() => {
    return invitations.filter((invitation) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = invitation.name?.toLowerCase().includes(query);
        const matchesEmail = invitation.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Dietary filter
      if (dietaryFilter !== "all") {
        if (dietaryFilter === "has-dietary") {
          if (!invitation.dietaryRestrictions?.trim()) return false;
        } else if (dietaryFilter === "no-dietary") {
          if (invitation.dietaryRestrictions?.trim()) return false;
        }
      }

      // RSVP filter
      if (rsvpFilter !== "all") {
        if (invitation.rsvp !== rsvpFilter) return false;
      }

      return true;
    });
  }, [invitations, searchQuery, dietaryFilter, rsvpFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGuests = filteredGuests.reduce((sum, inv) => sum + 1 + (inv.plusOnes || 0), 0);
    const withDietary = filteredGuests.filter((inv) => inv.dietaryRestrictions?.trim()).length;
    const withAccessibility = filteredGuests.filter((inv) => inv.accessibilityNeeds?.trim()).length;
    const totalPlusOnes = filteredGuests.reduce((sum, inv) => sum + (inv.plusOnes || 0), 0);

    return {
      totalGuests,
      withDietary,
      withAccessibility,
      totalPlusOnes,
    };
  }, [filteredGuests]);

  const handleViewDetails = (invitation: Invitation) => {
    setSelectedGuest(invitation);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">
          {t("dashboard.invitations.guestList.title", {}, "Guest List")}
        </h2>
        <p className={textMuted}>
          {t(
            "dashboard.invitations.guestList.description",
            {},
            "Comprehensive view of all guests with dietary and accessibility information"
          )}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.invitations.guestList.stats.totalGuests", {}, "Total Guests")}
                </p>
                <p className="text-2xl font-bold">{stats.totalGuests}</p>
              </div>
              <MdPeople className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.invitations.guestList.stats.plusOnes", {}, "Plus Ones")}
                </p>
                <p className="text-2xl font-bold">{stats.totalPlusOnes}</p>
              </div>
              <MdPeople className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "dashboard.invitations.guestList.stats.dietaryRestrictions",
                    {},
                    "Dietary Restrictions"
                  )}
                </p>
                <p className="text-2xl font-bold">{stats.withDietary}</p>
              </div>
              <MdRestaurant className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "dashboard.invitations.guestList.stats.accessibilityNeeds",
                    {},
                    "Accessibility Needs"
                  )}
                </p>
                <p className="text-2xl font-bold">{stats.withAccessibility}</p>
              </div>
              <MdAccessible className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MdFilterList className="h-5 w-5" />
            {t("dashboard.invitations.guestList.filters.title", {}, "Filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(
                  "dashboard.invitations.guestList.filters.searchPlaceholder",
                  {},
                  "Search by name or email..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Dietary Filter */}
            <Select value={dietaryFilter} onValueChange={setDietaryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("dashboard.invitations.guestList.filters.dietaryFilter.all", {}, "All Guests")}
                </SelectItem>
                <SelectItem value="has-dietary">
                  {t(
                    "dashboard.invitations.guestList.filters.dietaryFilter.hasDietary",
                    {},
                    "Has Dietary Restrictions"
                  )}
                </SelectItem>
                <SelectItem value="no-dietary">
                  {t(
                    "dashboard.invitations.guestList.filters.dietaryFilter.noDietary",
                    {},
                    "No Dietary Restrictions"
                  )}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* RSVP Filter */}
            <Select value={rsvpFilter} onValueChange={setRsvpFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t(
                    "dashboard.invitations.guestList.filters.rsvpFilter.all",
                    {},
                    "All RSVP Status"
                  )}
                </SelectItem>
                <SelectItem value="yes">
                  {t("dashboard.invitations.guestList.filters.rsvpFilter.accepted", {}, "Accepted")}
                </SelectItem>
                <SelectItem value="maybe">
                  {t("dashboard.invitations.guestList.filters.rsvpFilter.maybe", {}, "Maybe")}
                </SelectItem>
                <SelectItem value="no">
                  {t("dashboard.invitations.guestList.filters.rsvpFilter.declined", {}, "Declined")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-4">
              {t("dashboard.invitations.guestList.filters.showing", {}, "Showing")}{" "}
              {filteredGuests.length} {t("dashboard.invitations.guestList.filters.of", {}, "of")}{" "}
              {invitations.length}{" "}
              {t("dashboard.invitations.guestList.filters.guests", {}, "guests")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Guest List */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle>
            {t("dashboard.invitations.guestList.table.title", {}, "Guest Details")}
          </CardTitle>
          <CardDescription className={textMuted}>
            {filteredGuests.length}{" "}
            {filteredGuests.length === 1
              ? t("dashboard.invitations.guestList.table.guest", {}, "guest")
              : t("dashboard.invitations.guestList.table.guests", {}, "guests")}{" "}
            {t("dashboard.invitations.guestList.table.found", {}, "found")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredGuests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t(
                  "dashboard.invitations.guestList.emptyState",
                  {},
                  "No guests match your filters"
                )}
              </div>
            ) : (
              filteredGuests.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`p-4 border rounded-lg ${cardBorder} hover:bg-accent/50 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold">{invitation.name}</h3>
                        <Badge variant={invitation.rsvp === "yes" ? "default" : "secondary"}>
                          {invitation.rsvp ||
                            t(
                              "dashboard.invitations.guestList.table.noResponse",
                              {},
                              "No Response"
                            )}
                        </Badge>
                        {(invitation.plusOnes || 0) > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MdPeople className="h-3 w-3" />+{invitation.plusOnes}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{invitation.email}</span>
                        {invitation.phone && <span>{invitation.phone}</span>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {invitation.dietaryRestrictions && (
                          <div className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2 py-1 rounded">
                            <MdRestaurant className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {invitation.dietaryRestrictions}
                            </span>
                          </div>
                        )}
                        {invitation.accessibilityNeeds && (
                          <div className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                            <MdAccessible className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {invitation.accessibilityNeeds}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(invitation)}>
                      <MdVisibility className="h-4 w-4 mr-2" />
                      {t("dashboard.invitations.guestList.table.viewDetails", {}, "View Details")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guest Details Dialog */}
      <GuestDetailsDialog
        invitation={selectedGuest}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedGuest(null);
        }}
        readOnly={true}
        t={t}
      />
    </div>
  );
};
