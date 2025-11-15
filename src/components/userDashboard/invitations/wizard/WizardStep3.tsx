"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MdCheckCircle,
  MdEmail,
  MdPhone,
  MdPerson,
  MdWhatsapp,
  MdImage,
  MdMessage,
  MdSubject,
} from "react-icons/md";
import { useMemorials } from "@/hooks/useMemorials";
import { format } from "date-fns";

interface WizardData {
  memorialId: string;
  customSubject: string;
  message: string;
  invitationCard: File | null;
  recipients: Array<{
    name: string;
    email: string;
    phone: string;
  }>;
  role: string;
  sendViaEmail: boolean;
  sendViaWhatsApp: boolean;
}

interface WizardStep3Props {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  wizardData: WizardData;
}

export const WizardStep3: React.FC<WizardStep3Props> = ({ theme, t, wizardData }) => {
  const { data: memorialsData } = useMemorials();
  const memorials = memorialsData?.data?.memorials || [];
  const selectedMemorial = memorials.find((m) => m.id === wizardData.memorialId);

  const deliveryMethods = [];
  if (wizardData.sendViaEmail) deliveryMethods.push("Email");
  if (wizardData.sendViaWhatsApp) deliveryMethods.push("WhatsApp");

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div
        className={`flex items-start gap-3 p-4 rounded-lg ${
          theme === "dark"
            ? "bg-green-900/20 border border-green-800"
            : "bg-green-50 border border-green-200"
        }`}
      >
        <MdCheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className={`font-medium ${theme === "dark" ? "text-green-300" : "text-green-800"}`}>
            {t("dashboard.invitations.wizard.readyToSend")}
          </p>
          <p className={`text-sm mt-1 ${theme === "dark" ? "text-green-400" : "text-green-700"}`}>
            {t("dashboard.invitations.wizard.step3Info")}
          </p>
        </div>
      </div>

      {/* Memorial Details */}
      <Card className={theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MdPerson className="h-5 w-5 text-blue-600" />
            {t("dashboard.invitations.wizard.memorialPage")}
          </h3>
          {selectedMemorial && (
            <div className="space-y-2">
              <p className="text-lg font-medium">{selectedMemorial.name}</p>
              {selectedMemorial.birthDate && selectedMemorial.deathDate && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedMemorial.birthDate), "MMMM d, yyyy")} -{" "}
                  {format(new Date(selectedMemorial.deathDate), "MMMM d, yyyy")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation Details */}
      <Card className={theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold mb-4">
            {t("dashboard.invitations.wizard.invitationDetails")}
          </h3>

          {/* Custom Subject */}
          {wizardData.customSubject && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MdSubject className="h-4 w-4" />
                <span>{t("dashboard.invitations.wizard.customSubject")}</span>
              </div>
              <p className="text-base">{wizardData.customSubject}</p>
            </div>
          )}

          {/* Personal Message */}
          {wizardData.message && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MdMessage className="h-4 w-4" />
                <span>{t("dashboard.invitations.wizard.personalMessage")}</span>
              </div>
              <p className="text-base whitespace-pre-wrap">{wizardData.message}</p>
            </div>
          )}

          {/* Invitation Card */}
          {wizardData.invitationCard && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MdImage className="h-4 w-4" />
                <span>{t("dashboard.invitations.wizard.invitationCard")}</span>
              </div>
              <div className="relative w-full max-w-xs rounded-lg overflow-hidden border">
                <Image
                  src={URL.createObjectURL(wizardData.invitationCard)}
                  alt="Invitation card preview"
                  width={400}
                  height={300}
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {!wizardData.customSubject && !wizardData.message && !wizardData.invitationCard && (
            <p className="text-sm text-muted-foreground italic">
              {t("dashboard.invitations.wizard.noCustomDetails")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delivery Method */}
      <Card className={theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">{t("dashboard.invitations.wizard.deliveryMethod")}</h3>
          <div className="flex flex-wrap gap-2">
            {wizardData.sendViaEmail && (
              <Badge variant="default" className="flex items-center gap-1.5 px-3 py-1.5">
                <MdEmail className="h-4 w-4" />
                {t("dashboard.invitations.wizard.email")}
              </Badge>
            )}
            {wizardData.sendViaWhatsApp && (
              <Badge
                variant="default"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700"
              >
                <MdWhatsapp className="h-4 w-4" />
                WhatsApp
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipients Summary */}
      <Card className={theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {t("dashboard.invitations.wizard.recipientsSummary", {
                count: wizardData.recipients.length,
              })}
            </h3>
            <Badge variant="secondary">
              {wizardData.recipients.length} {t("dashboard.invitations.wizard.total")}
            </Badge>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {wizardData.recipients.map((recipient, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {recipient.name || t("dashboard.invitations.wizard.anonymousGuest")}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {recipient.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MdEmail className="h-4 w-4" />
                          {recipient.email}
                        </div>
                      )}
                      {recipient.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MdPhone className="h-4 w-4" />
                          {recipient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={theme === "dark" ? "bg-blue-900/20" : "bg-blue-50"}>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{wizardData.recipients.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t(
                wizardData.recipients.length === 1
                  ? "dashboard.invitations.wizard.recipientCountSingular"
                  : "dashboard.invitations.wizard.recipientCountPlural"
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={theme === "dark" ? "bg-green-900/20" : "bg-green-50"}>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{deliveryMethods.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t(
                deliveryMethods.length === 1
                  ? "dashboard.invitations.wizard.deliveryMethodCountSingular"
                  : "dashboard.invitations.wizard.deliveryMethodCountPlural"
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
