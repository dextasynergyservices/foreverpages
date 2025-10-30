import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";

interface InvitationDetailsFormProps {
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const InvitationDetailsForm: React.FC<InvitationDetailsFormProps> = ({ t }) => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex-1 space-y-4">
        <div>
          <Label htmlFor="invitation-subject">
            {t("dashboard.invitations.create.emailSubject")}
          </Label>
          <Input
            id="invitation-subject"
            placeholder="You're invited to remember [Name]"
            defaultValue="You're invited to remember Sarah Johnson"
            className="w-full"
          />
        </div>
        <div className="flex-1 flex flex-col">
          <Label htmlFor="invitation-message">
            {t("dashboard.invitations.create.personalMessage")}
          </Label>
          <Textarea
            id="invitation-message"
            placeholder="Add a personal message to your invitation..."
            rows={8}
            defaultValue="We would be honored by your presence as we celebrate the life of Sarah Johnson and share our cherished memories together."
            className="flex-1 min-h-[200px] resize-none"
          />
        </div>
      </div>
    </div>
  );
};
