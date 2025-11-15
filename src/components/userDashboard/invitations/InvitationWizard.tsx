"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MdArrowBack, MdArrowForward, MdSend, MdCheck } from "react-icons/md";
import {
  WizardStep1,
  WizardStep1Handle,
} from "@/components/userDashboard/invitations/wizard/WizardStep1";
import {
  WizardStep2,
  WizardStep2Handle,
} from "@/components/userDashboard/invitations/wizard/WizardStep2";
import { WizardStep3 } from "@/components/userDashboard/invitations/wizard/WizardStep3";
import { useSendInvitations } from "@/hooks/useInvitations";
import { createInvitationSchema } from "@/lib/validation";
import { toast } from "react-hot-toast";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface InvitationWizardProps {
  theme: string;
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

type WizardStep = 1 | 2 | 3;

export interface WizardData {
  // Step 1
  memorialId: string;
  customSubject: string;
  message: string;
  invitationCard: File | null;

  // Step 2
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
  }>;
  role: string;
  sendViaEmail: boolean;
  sendViaWhatsApp: boolean;
}

export const InvitationWizard: React.FC<InvitationWizardProps> = ({ theme, themeClasses, t }) => {
  const { cardBorder, cardBg } = themeClasses;
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({});
  const sendInvitationsMutation = useSendInvitations();

  // Refs for accessing step data
  const step1Ref = useRef<WizardStep1Handle>(null);
  const step2Ref = useRef<WizardStep2Handle>(null);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const stepTitles = [
    t("dashboard.invitations.wizard.step1Title", {}, "Invitation Details"),
    t("dashboard.invitations.wizard.step2Title", {}, "Add Recipients"),
    t("dashboard.invitations.wizard.step3Title", {}, "Review & Send"),
  ];

  const handleNext = async () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      const step1Data = step1Ref.current?.getData();
      if (!step1Data) {
        toast.error(t("dashboard.invitations.errors.completeRequired"));
        return;
      }

      // Validate memorial selection
      if (!step1Data.memorialId) {
        toast.error(t("dashboard.invitations.errors.selectMemorial"));
        return;
      }

      // Update wizard data
      setWizardData((prev) => ({ ...prev, ...step1Data }));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const step2Data = step2Ref.current?.getData();
      if (!step2Data) {
        toast.error(t("dashboard.invitations.errors.completeRequired"));
        return;
      }

      // Validate recipients
      if (!step2Data.recipients || step2Data.recipients.length === 0) {
        toast.error(t("dashboard.invitations.errors.addRecipient"));
        return;
      }

      // Validate delivery method
      if (!step2Data.sendViaEmail && !step2Data.sendViaWhatsApp) {
        toast.error(t("dashboard.invitations.errors.selectDeliveryMethod"));
        return;
      }

      // Validate each recipient has appropriate contact info
      const hasEmailMethod = step2Data.sendViaEmail;
      const hasWhatsAppMethod = step2Data.sendViaWhatsApp;

      for (const recipient of step2Data.recipients) {
        if (hasEmailMethod && !recipient.email) {
          toast.error(
            t("dashboard.invitations.errors.missingEmail", {
              name: recipient.name || t("dashboard.invitations.errors.aRecipient"),
            })
          );
          return;
        }
        if (hasWhatsAppMethod && !recipient.phone) {
          toast.error(
            t("dashboard.invitations.errors.missingPhone", {
              name: recipient.name || t("dashboard.invitations.errors.aRecipient"),
            })
          );
          return;
        }
      }

      // Update wizard data
      setWizardData((prev) => ({ ...prev, ...step2Data }));
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSend = async () => {
    try {
      // Final validation
      const completeData = wizardData as WizardData;

      const validation = createInvitationSchema.safeParse({
        memorialId: completeData.memorialId,
        role: completeData.role,
        customSubject: completeData.customSubject,
        message: completeData.message,
        recipients: completeData.recipients.map((r) => ({
          name: r.name || undefined,
          email: r.email || undefined,
          phone: r.phone || undefined,
        })),
        sendViaEmail: completeData.sendViaEmail,
        sendViaWhatsApp: completeData.sendViaWhatsApp,
      });

      if (!validation.success) {
        const errors = validation.error.issues;
        const firstError = errors[0];
        toast.error(firstError.message, { duration: 5000 });
        return;
      }

      // Send invitations
      await sendInvitationsMutation.mutateAsync({
        data: {
          memorialId: completeData.memorialId,
          role: completeData.role,
          customSubject: completeData.customSubject || undefined,
          message: completeData.message || undefined,
          recipients: completeData.recipients.map((r) => ({
            name: r.name || undefined,
            email: r.email || undefined,
            phone: r.phone || undefined,
          })),
          sendViaEmail: completeData.sendViaEmail,
          sendViaWhatsApp: completeData.sendViaWhatsApp,
        },
        cardFile: completeData.invitationCard || undefined,
      });

      // Success! Reset wizard
      const count = completeData.recipients.length;
      toast.success(
        t("dashboard.invitations.success.bulkSent", {
          count,
          plural: count > 1 ? "s" : "",
        }),
        { duration: 4000 }
      );
      setCurrentStep(1);
      setWizardData({});
      step1Ref.current?.reset?.();
      step2Ref.current?.reset?.();
    } catch (error) {
      console.error("Error sending invitations:", error);
      // Error toast already shown by mutation
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardContent className="pt-6">
          {/* Progress Section */}
          <div className="mb-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep === step
                        ? "border-blue-600 bg-blue-600 text-white"
                        : currentStep > step
                          ? "border-green-600 bg-green-600 text-white"
                          : theme === "dark"
                            ? "border-gray-600 text-gray-400"
                            : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {currentStep > step ? (
                      <MdCheck className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{step}</span>
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-all ${
                        currentStep > step
                          ? "bg-green-600"
                          : theme === "dark"
                            ? "bg-gray-700"
                            : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-2 mb-2" />

            {/* Step Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-1">{stepTitles[currentStep - 1]}</h2>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {t(
                  "dashboard.invitations.wizard.stepProgress",
                  { current: currentStep, total: totalSteps },
                  `Step ${currentStep} of ${totalSteps}`
                )}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <WizardStep1 ref={step1Ref} theme={theme} t={t} initialData={wizardData} />
            )}
            {currentStep === 2 && (
              <WizardStep2 ref={step2Ref} theme={theme} t={t} initialData={wizardData} />
            )}
            {currentStep === 3 && (
              <WizardStep3 theme={theme} t={t} wizardData={wizardData as WizardData} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={currentStep === 1 ? "invisible" : ""}
            >
              <MdArrowBack className="h-4 w-4 mr-2" />
              {t("dashboard.invitations.wizard.back", {}, "Back")}
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                {t("dashboard.invitations.wizard.next", {}, "Next")}
                <MdArrowForward className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={sendInvitationsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MdSend className="h-4 w-4 mr-2" />
                {sendInvitationsMutation.isPending
                  ? t("dashboard.invitations.wizard.sending", {}, "Sending...")
                  : t("dashboard.invitations.wizard.send", {}, "Send Invitations")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
