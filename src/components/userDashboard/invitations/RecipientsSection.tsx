import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Send, Copy } from "lucide-react";

interface RecipientsSectionProps {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  onImportContacts: () => void;
  onSendInvitations: () => void;
}

export const RecipientsSection: React.FC<RecipientsSectionProps> = ({
  theme,
  t,
  onImportContacts,
  onSendInvitations,
}) => {
  return (
    <div className="space-y-4 w-full mx-auto">
      <div>
        <Label htmlFor="recipient-emails">{t("dashboard.invitations.create.emailAddresses")}</Label>
        <Textarea
          id="recipient-emails"
          placeholder="Enter email addresses separated by commas or new lines"
          rows={11}
          className="resize-none w-full"
        />
      </div>
      <div className="flex gap-2 justify-center">
        <Button
          variant={theme === "dark" ? "memorial-outline" : "outline"}
          onClick={onImportContacts}
        >
          <Copy className="h-4 w-4 mr-2" />
          {t("dashboard.invitations.actions.importFromContacts")}
        </Button>
        <Button
          variant="memorial"
          className={theme === "dark" ? "bg-white text-black" : "bg-black text-white"}
          onClick={onSendInvitations}
        >
          <Send className="h-4 w-4 mr-2" />
          {t("dashboard.invitations.actions.sendInvitations")}
        </Button>
      </div>
    </div>
  );
};
