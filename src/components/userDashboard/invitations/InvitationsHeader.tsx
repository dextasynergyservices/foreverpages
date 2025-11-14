import React from "react";
import { Button } from "@/components/ui/button";
import { MdRefresh } from "react-icons/md";

interface InvitationsHeaderProps {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  textMuted: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const InvitationsHeader: React.FC<InvitationsHeaderProps> = ({
  t,
  textMuted,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="mb-6 md:mb-8 flex items-start justify-between">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-serif font-bold">
          {t("dashboard.invitations.title")}
        </h1>
        <p className={`mt-2 ${textMuted}`}>{t("dashboard.invitations.subtitle")}</p>
      </div>
      {onRefresh && (
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <MdRefresh className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {t("dashboard.invitations.actions.refresh", {}, "Refresh")}
        </Button>
      )}
    </div>
  );
};
