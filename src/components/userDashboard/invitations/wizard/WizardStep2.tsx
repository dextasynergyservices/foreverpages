"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MdAdd, MdDelete, MdEmail, MdPhone, MdInfo, MdPerson, MdWhatsapp } from "react-icons/md";

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface WizardStep2Props {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  initialData?: Partial<{
    recipients: Recipient[];
    role: string;
    sendViaEmail: boolean;
    sendViaWhatsApp: boolean;
  }>;
}

export interface WizardStep2Handle {
  getData: () => {
    recipients: Recipient[];
    role: string;
    sendViaEmail: boolean;
    sendViaWhatsApp: boolean;
  };
  reset?: () => void;
}

export const WizardStep2 = forwardRef<WizardStep2Handle, WizardStep2Props>(
  ({ theme, t, initialData }, ref) => {
    const [recipients, setRecipients] = useState<Recipient[]>(
      initialData?.recipients || [{ id: crypto.randomUUID(), name: "", email: "", phone: "" }]
    );
    const [sendViaEmail, setSendViaEmail] = useState<boolean>(
      initialData?.sendViaEmail !== undefined ? initialData.sendViaEmail : true
    );
    const [sendViaWhatsApp, setSendViaWhatsApp] = useState<boolean>(
      initialData?.sendViaWhatsApp !== undefined ? initialData.sendViaWhatsApp : false
    );

    useImperativeHandle(ref, () => ({
      getData: () => ({
        recipients: recipients.filter((r) => r.name.trim() || r.email.trim() || r.phone.trim()),
        role: "VIEWER", // Default role for event guests
        sendViaEmail,
        sendViaWhatsApp,
      }),
      reset: () => {
        setRecipients([{ id: crypto.randomUUID(), name: "", email: "", phone: "" }]);
        setSendViaEmail(true);
        setSendViaWhatsApp(false);
      },
    }));

    const handleAddRecipient = () => {
      setRecipients([...recipients, { id: crypto.randomUUID(), name: "", email: "", phone: "" }]);
    };

    const handleRemoveRecipient = (id: string) => {
      if (recipients.length > 1) {
        setRecipients(recipients.filter((r) => r.id !== id));
      }
    };

    const handleRecipientChange = (id: string, field: keyof Recipient, value: string) => {
      setRecipients(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const filledRecipientsCount = recipients.filter(
      (r) => r.name.trim() || r.email.trim() || r.phone.trim()
    ).length;

    return (
      <div className="space-y-6">
        {/* Info Banner */}
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            theme === "dark"
              ? "bg-blue-900/20 border border-blue-800"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <MdInfo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className={`text-sm ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
            {t("dashboard.invitations.wizard.step2Info")}
          </p>
        </div>

        {/* Delivery Method Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            {t("dashboard.invitations.create.deliveryMethod", {}, "Delivery Method")}
            <span className="text-red-500 ml-1">*</span>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email Option */}
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                sendViaEmail
                  ? theme === "dark"
                    ? "border-blue-600 bg-blue-900/20"
                    : "border-blue-600 bg-blue-50"
                  : theme === "dark"
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSendViaEmail(!sendViaEmail)}
            >
              <Checkbox
                id="email"
                checked={sendViaEmail}
                onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 cursor-pointer font-medium"
                >
                  <MdEmail className="h-5 w-5 text-blue-600" />
                  {t("dashboard.invitations.create.sendViaEmail", {}, "Send via Email")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard.invitations.wizard.professionalEmail")}
                </p>
              </div>
            </div>

            {/* WhatsApp Option */}
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                sendViaWhatsApp
                  ? theme === "dark"
                    ? "border-green-600 bg-green-900/20"
                    : "border-green-600 bg-green-50"
                  : theme === "dark"
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSendViaWhatsApp(!sendViaWhatsApp)}
            >
              <Checkbox
                id="whatsapp"
                checked={sendViaWhatsApp}
                onCheckedChange={(checked) => setSendViaWhatsApp(checked === true)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <Label
                  htmlFor="whatsapp"
                  className="flex items-center gap-2 cursor-pointer font-medium"
                >
                  <MdWhatsapp className="h-5 w-5 text-green-600" />
                  {t("dashboard.invitations.create.sendViaWhatsApp", {}, "Send via WhatsApp")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard.invitations.wizard.directMessaging")}
                </p>
              </div>
            </div>
          </div>

          {!sendViaEmail && !sendViaWhatsApp && (
            <p className="text-sm text-red-500">
              {t("dashboard.invitations.wizard.selectDeliveryMethod")}
            </p>
          )}
        </div>

        {/* Recipients Header */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">
              {t("dashboard.invitations.create.recipients", {}, "Recipients")}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {filledRecipientsCount > 0
                ? t(
                    filledRecipientsCount === 1
                      ? "dashboard.invitations.wizard.recipientsAddedSingular"
                      : "dashboard.invitations.wizard.recipientsAddedPlural",
                    {
                      count: filledRecipientsCount,
                    }
                  )
                : t("dashboard.invitations.wizard.addOneRecipient")}
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MdPerson className="h-4 w-4" />
            {recipients.length}
          </Badge>
        </div>

        {/* Recipients List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {recipients.map((recipient, index) => (
            <div
              key={recipient.id}
              className={`p-4 rounded-lg border ${
                theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.invitations.wizard.recipientNumber", { number: index + 1 })}
                </span>
                {recipients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <MdDelete className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${recipient.id}`} className="text-sm">
                    {t("dashboard.invitations.wizard.name")}
                  </Label>
                  <Input
                    id={`name-${recipient.id}`}
                    placeholder="John Doe"
                    value={recipient.name}
                    onChange={(e) => handleRecipientChange(recipient.id, "name", e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor={`email-${recipient.id}`} className="text-sm">
                    {t("dashboard.invitations.wizard.email")}{" "}
                    {sendViaEmail && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id={`email-${recipient.id}`}
                      type="email"
                      placeholder="john@example.com"
                      value={recipient.email}
                      onChange={(e) => handleRecipientChange(recipient.id, "email", e.target.value)}
                      className="pl-9"
                      required={sendViaEmail}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor={`phone-${recipient.id}`} className="text-sm">
                    {t("dashboard.invitations.wizard.phone")}{" "}
                    {sendViaWhatsApp && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative">
                    <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id={`phone-${recipient.id}`}
                      type="tel"
                      placeholder="+1234567890"
                      value={recipient.phone}
                      onChange={(e) => handleRecipientChange(recipient.id, "phone", e.target.value)}
                      className="pl-9"
                      required={sendViaWhatsApp}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Recipient Button */}
        <Button type="button" variant="outline" onClick={handleAddRecipient} className="w-full">
          <MdAdd className="h-4 w-4 mr-2" />
          {t("dashboard.invitations.wizard.addRecipient")}
        </Button>
      </div>
    );
  }
);

WizardStep2.displayName = "WizardStep2";
