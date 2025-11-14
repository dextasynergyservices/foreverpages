import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MdSearch, MdFilterList } from "react-icons/md";
import { Button } from "@/components/ui/button";

interface SearchAndFilterProps {
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onDeliveryMethodChange: (method: string) => void;
  searchQuery: string;
  statusFilter: string;
  deliveryMethodFilter: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  resultCount: number;
  totalCount: number;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearchChange,
  onStatusChange,
  onDeliveryMethodChange,
  searchQuery,
  statusFilter,
  deliveryMethodFilter,
  t,
  resultCount,
  totalCount,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  const hasActiveFilters = statusFilter !== "all" || deliveryMethodFilter !== "all" || searchQuery;

  const clearAllFilters = () => {
    setLocalQuery("");
    onSearchChange("");
    onStatusChange("all");
    onDeliveryMethodChange("all");
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t(
            "dashboard.invitations.search.placeholder",
            {},
            "Search by name, email, or phone..."
          )}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        {/* Status Filter */}
        <div className="flex-1 w-full sm:w-auto">
          <Label htmlFor="status-filter" className="text-sm mb-2 flex items-center gap-2">
            <MdFilterList className="h-4 w-4" />
            {t("dashboard.invitations.filter.status", {}, "Status")}
          </Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("dashboard.invitations.filter.statusOptions.all")}
              </SelectItem>
              <SelectItem value="pending">
                {t("dashboard.invitations.filter.statusOptions.pending")}
              </SelectItem>
              <SelectItem value="accepted">
                {t("dashboard.invitations.filter.statusOptions.accepted")}
              </SelectItem>
              <SelectItem value="declined">
                {t("dashboard.invitations.filter.statusOptions.declined")}
              </SelectItem>
              <SelectItem value="expired">
                {t("dashboard.invitations.filter.statusOptions.expired")}
              </SelectItem>
              <SelectItem value="revoked">
                {t("dashboard.invitations.filter.statusOptions.revoked")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delivery Method Filter */}
        <div className="flex-1 w-full sm:w-auto">
          <Label htmlFor="delivery-filter" className="text-sm mb-2 flex items-center gap-2">
            <MdFilterList className="h-4 w-4" />
            {t("dashboard.invitations.filter.delivery", {}, "Delivery Method")}
          </Label>
          <Select value={deliveryMethodFilter} onValueChange={onDeliveryMethodChange}>
            <SelectTrigger id="delivery-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("dashboard.invitations.filter.deliveryOptions.all")}
              </SelectItem>
              <SelectItem value="email">
                {t("dashboard.invitations.filter.deliveryOptions.email")}
              </SelectItem>
              <SelectItem value="whatsapp">
                {t("dashboard.invitations.filter.deliveryOptions.whatsapp")}
              </SelectItem>
              <SelectItem value="both">
                {t("dashboard.invitations.filter.deliveryOptions.both")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full sm:w-auto"
          >
            {t("dashboard.invitations.filter.clearFilters")}
          </Button>
        )}
      </div>

      {/* Results Count */}
      {(searchQuery || hasActiveFilters) && (
        <div className="text-sm text-muted-foreground">
          {t("dashboard.invitations.filter.showing")} {resultCount}{" "}
          {t("dashboard.invitations.filter.of")} {totalCount}{" "}
          {totalCount !== 1
            ? t("dashboard.invitations.filter.invitations")
            : t("dashboard.invitations.filter.invitation")}
          {searchQuery && (
            <span className="ml-1">
              {t("dashboard.invitations.filter.matching")} &quot;
              <span className="font-medium">{searchQuery}</span>&quot;
            </span>
          )}
        </div>
      )}
    </div>
  );
};
