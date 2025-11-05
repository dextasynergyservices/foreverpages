import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { InvitationList } from "./InvitationList";
import { Invitation } from "./Invitations";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface ManageInvitationsTabProps {
  invitations: Invitation[];
  onRemoveInvitation: (id: string) => void;
  onResendInvitation: (id: string) => void;
  theme: string;
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const ManageInvitationsTab: React.FC<ManageInvitationsTabProps> = ({
  invitations,
  onRemoveInvitation,
  onResendInvitation,
  theme,
  themeClasses,
  t,
}) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;

  const handleExportList = () => {
    console.log("Exporting invitation list");
  };

  const handleAddRecipients = () => {
    console.log("Adding more recipients");
  };

  return (
    <Card className={`border ${cardBorder} ${cardBg}`}>
      <CardHeader>
        <CardTitle>{t("dashboard.invitations.manage.sentInvitations")}</CardTitle>
        <CardDescription className={textMuted}>
          {t("dashboard.invitations.manage.trackDelivery")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InvitationList
          invitations={invitations}
          onRemoveInvitation={onRemoveInvitation}
          onResendInvitation={onResendInvitation}
          theme={theme}
          cardBorder={cardBorder}
          textMuted={textMuted}
          t={t}
        />

        <div className="mt-6 flex gap-2 flex-col sm:flex-row">
          <Button
            variant={theme === "dark" ? "memorial-outline" : "outline"}
            onClick={handleExportList}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("dashboard.invitations.actions.exportList")}
          </Button>
          <Button variant="memorial" onClick={handleAddRecipients}>
            {t("dashboard.invitations.actions.addMoreRecipients")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
