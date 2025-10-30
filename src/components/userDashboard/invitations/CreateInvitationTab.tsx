import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, Users } from "lucide-react";
import { InvitationDetailsForm } from "./InvitationDetailsForm";
import { ServiceInformationForm } from "./ServiceInformationForm";
import { RecipientsSection } from "./RecipientsSection";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface CreateInvitationTabProps {
  theme: string;
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const CreateInvitationTab: React.FC<CreateInvitationTabProps> = ({
  theme,
  themeClasses,
  t,
}) => {
  const { cardBorder, cardBg } = themeClasses;

  const handleSendInvitations = () => {
    console.log("Sending invitations");
  };

  const handleImportContacts = () => {
    console.log("Importing from contacts");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Invitation Details */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("dashboard.invitations.create.invitationDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InvitationDetailsForm t={t} />
        </CardContent>
      </Card>

      {/* Service Information */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("dashboard.invitations.create.serviceInformation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceInformationForm t={t} />
        </CardContent>
      </Card>

      {/* Recipients Section */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("dashboard.invitations.create.recipients")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecipientsSection
            theme={theme}
            t={t}
            onImportContacts={handleImportContacts}
            onSendInvitations={handleSendInvitations}
          />
        </CardContent>
      </Card>
    </div>
  );
};
