import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MdSend, MdAdd, MdDelete } from "react-icons/md";
import { NoRecipientsEmpty } from "./EmptyStates";

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface RecipientsSectionProps {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  onSendInvitations: () => void;
  isLoading?: boolean;
}

export interface RecipientsSectionHandle {
  getData: () => {
    recipients: { name: string; email: string; phone: string }[];
    role: string;
    sendViaEmail: boolean;
    sendViaWhatsApp: boolean;
  };
}

export const RecipientsSection = forwardRef<RecipientsSectionHandle, RecipientsSectionProps>(
  ({ theme, t, onSendInvitations, isLoading = false }, ref) => {
    const [recipients, setRecipients] = useState<Recipient[]>([
      { id: "1", name: "", email: "", phone: "" },
    ]);
    const [role, setRole] = useState<string>("VIEWER");
    const [sendViaEmail, setSendViaEmail] = useState(true);
    const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        recipients: recipients.map(({ name, email, phone }) => ({ name, email, phone })),
        role,
        sendViaEmail,
        sendViaWhatsApp,
      }),
    }));

    const addRecipient = () => {
      setRecipients([...recipients, { id: Date.now().toString(), name: "", email: "", phone: "" }]);
    };

    const removeRecipient = (id: string) => {
      if (recipients.length > 1) {
        setRecipients(recipients.filter((r) => r.id !== id));
      }
    };

    const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
      setRecipients(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    return (
      <div className="space-y-4 w-full mx-auto">
        {/* Role Selection */}
        <div>
          <Label htmlFor="role-select">
            {t("dashboard.invitations.create.role", {}, "Role")}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role-select" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEWER">Viewer - Can view and leave tributes</SelectItem>
              <SelectItem value="CONTRIBUTOR">
                Contributor - Can upload media and add memories
              </SelectItem>
              <SelectItem value="EDITOR">Editor - Can edit memorial content</SelectItem>
              <SelectItem value="ADMIN">
                Admin - Can manage memorial and moderate content
              </SelectItem>
              <SelectItem value="OWNER">Owner - Full control over memorial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delivery Methods */}
        <div>
          <Label className="mb-2 block">
            {t("dashboard.invitations.create.deliveryMethod", {}, "Delivery Method")}
            <span className="text-destructive ml-1">*</span>
          </Label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-via-email"
                checked={sendViaEmail}
                onCheckedChange={(checked: boolean) => setSendViaEmail(checked)}
              />
              <label
                htmlFor="send-via-email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send via Email
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-via-whatsapp"
                checked={sendViaWhatsApp}
                onCheckedChange={(checked: boolean) => setSendViaWhatsApp(checked)}
              />
              <label
                htmlFor="send-via-whatsapp"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send via WhatsApp
              </label>
            </div>
          </div>
        </div>

        {/* Recipients List */}
        <div className="space-y-3">
          <Label>{t("dashboard.invitations.create.recipients", {}, "Recipients")}</Label>
          {recipients.length === 0 ? (
            <NoRecipientsEmpty t={t} />
          ) : (
            recipients.map((recipient, index) => (
              <div key={recipient.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Recipient {index + 1}</span>
                  {recipients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(recipient.id)}
                    >
                      <MdDelete className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Name (optional)"
                  value={recipient.name}
                  onChange={(e) => updateRecipient(recipient.id, "name", e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={recipient.email}
                  onChange={(e) => updateRecipient(recipient.id, "email", e.target.value)}
                />
                <Input
                  type="tel"
                  placeholder="Phone (e.g., +1234567890)"
                  value={recipient.phone}
                  onChange={(e) => updateRecipient(recipient.id, "phone", e.target.value)}
                />
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <Button type="button" variant="outline" onClick={addRecipient}>
            <MdAdd className="h-4 w-4 mr-2" />
            {t("dashboard.invitations.actions.addRecipient", {}, "Add Recipient")}
          </Button>
          <Button
            variant="memorial"
            className={theme === "dark" ? "bg-white text-black" : "bg-black text-white"}
            onClick={onSendInvitations}
            disabled={isLoading}
          >
            <MdSend className="h-4 w-4 mr-2" />
            {isLoading
              ? t("dashboard.invitations.actions.sending", {}, "Sending...")
              : t("dashboard.invitations.actions.sendInvitations")}
          </Button>
        </div>
      </div>
    );
  }
);

RecipientsSection.displayName = "RecipientsSection";
