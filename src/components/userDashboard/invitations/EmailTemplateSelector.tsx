"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { MdEmail, MdClose, MdCheckCircle, MdChurch, MdPeople } from "react-icons/md";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  subject: string;
  body: string;
  variables: string[];
}

interface EmailTemplateSelectorProps {
  memorialName: string;
  serviceDate?: string;
  onSelectTemplate: (template: EmailTemplate, customMessage?: string) => void;
  onClose: () => void;
  theme: "light" | "dark";
  themeClasses: {
    card: string;
    cardHover: string;
    text: string;
    mutedText: string;
    border: string;
    input: string;
    button: string;
  };
  t: (key: string, params?: Record<string, unknown>, fallback?: string) => string;
}

const templates: EmailTemplate[] = [
  {
    id: "formal",
    name: "Formal",
    description: "Professional and respectful tone for formal services",
    icon: <MdEmail className="h-6 w-6" />,
    subject: "You're Invited to {{memorial_name}}'s Memorial Service",
    body: `Dear {{recipient_name}},

You are cordially invited to attend the memorial service for {{memorial_name}}.

Date & Time: {{service_date}}
Location: {{service_location}}

{{custom_message}}

Your presence would be deeply appreciated as we gather to honor and celebrate their life.

With sincere regards,
{{sender_name}}`,
    variables: [
      "recipient_name",
      "memorial_name",
      "service_date",
      "service_location",
      "custom_message",
      "sender_name",
    ],
  },
  {
    id: "casual",
    name: "Casual",
    description: "Warm and personal tone for intimate gatherings",
    icon: <MdPeople className="h-6 w-6" />,
    subject: "Join us in remembering {{memorial_name}}",
    body: `Hi {{recipient_name}},

I hope this message finds you well. I wanted to reach out personally to invite you to join us in celebrating the life of {{memorial_name}}.

We're gathering on {{service_date}} at {{service_location}}.

{{custom_message}}

It would mean so much to have you there as we share memories and support each other during this time.

Looking forward to seeing you,
{{sender_name}}`,
    variables: [
      "recipient_name",
      "memorial_name",
      "service_date",
      "service_location",
      "custom_message",
      "sender_name",
    ],
  },
  {
    id: "religious",
    name: "Religious",
    description: "Faith-based tone with spiritual elements",
    icon: <MdChurch className="h-6 w-6" />,
    subject: "Memorial Service for {{memorial_name}} - Join Us in Prayer",
    body: `Dear {{recipient_name}},

With faith and hope in God's eternal love, we invite you to join us for the memorial service of {{memorial_name}}.

Date & Time: {{service_date}}
Location: {{service_location}}

{{custom_message}}

As we gather to celebrate their life and legacy, we find comfort in knowing they are at peace in God's care. Your prayers and presence would be a blessing to all of us.

In faith and fellowship,
{{sender_name}}`,
    variables: [
      "recipient_name",
      "memorial_name",
      "service_date",
      "service_location",
      "custom_message",
      "sender_name",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    description: "Create your own message from scratch",
    icon: <MdCheckCircle className="h-6 w-6" />,
    subject: "{{memorial_name}} Memorial Service",
    body: `{{custom_message}}`,
    variables: ["custom_message"],
  },
];

const EmailTemplateSelector: React.FC<EmailTemplateSelectorProps> = ({
  memorialName,
  serviceDate,
  onSelectTemplate,
  onClose,
  theme,
  themeClasses,
  t,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    if (template.id === "custom") {
      setCustomMessage("");
    } else {
      setCustomMessage("");
    }
    setPreviewMode(true);
  };

  const replaceVariables = (text: string): string => {
    return text
      .replace(/\{\{memorial_name\}\}/g, memorialName)
      .replace(/\{\{service_date\}\}/g, serviceDate || "[Service Date]")
      .replace(/\{\{service_location\}\}/g, "[Service Location]")
      .replace(/\{\{recipient_name\}\}/g, "[Recipient Name]")
      .replace(/\{\{sender_name\}\}/g, "[Your Name]")
      .replace(/\{\{custom_message\}\}/g, customMessage || "[Your custom message]");
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, customMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className={`${themeClasses.card} w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                {t("dashboard.invitations.templates.title", {}, "Choose Email Template")}
              </h2>
              <p className={themeClasses.mutedText}>
                {t(
                  "dashboard.invitations.templates.description",
                  {},
                  "Select a template or create your own custom message"
                )}
              </p>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className={themeClasses.button}>
              <MdClose className="h-5 w-5" />
            </Button>
          </div>

          {!previewMode ? (
            /* Template Selection Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`${themeClasses.cardHover} p-4 cursor-pointer transition-all hover:shadow-lg ${themeClasses.border}`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${themeClasses.text}`}>{template.name}</h3>
                      <p className={`text-sm ${themeClasses.mutedText}`}>{template.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Template Preview and Customization */
            <div className="space-y-6">
              {/* Back Button */}
              <Button
                onClick={() => {
                  setPreviewMode(false);
                  setSelectedTemplate(null);
                  setCustomMessage("");
                }}
                variant="ghost"
                className={themeClasses.button}
              >
                ← {t("common.back", {}, "Back to templates")}
              </Button>

              {/* Template Name */}
              <div>
                <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                  {selectedTemplate?.name} {t("common.template", {}, "Template")}
                </h3>
                <p className={themeClasses.mutedText}>{selectedTemplate?.description}</p>
              </div>

              {/* Custom Message Input */}
              {selectedTemplate?.id !== "custom" && (
                <div className="space-y-2">
                  <Label className={themeClasses.text}>
                    {t(
                      "dashboard.invitations.templates.customMessage",
                      {},
                      "Custom Message (Optional)"
                    )}
                  </Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={t(
                      "dashboard.invitations.templates.customMessagePlaceholder",
                      {},
                      "Add a personal message that will be included in the invitation..."
                    )}
                    className={`${themeClasses.input} min-h-[100px]`}
                    rows={4}
                  />
                </div>
              )}

              {/* Full Custom Message for Custom Template */}
              {selectedTemplate?.id === "custom" && (
                <div className="space-y-2">
                  <Label className={themeClasses.text}>
                    {t("dashboard.invitations.templates.yourMessage", {}, "Your Message")}
                  </Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={t(
                      "dashboard.invitations.templates.customFullPlaceholder",
                      {},
                      "Write your complete invitation message..."
                    )}
                    className={`${themeClasses.input} min-h-[200px]`}
                    rows={8}
                  />
                </div>
              )}

              {/* Preview */}
              <div className="space-y-2">
                <Label className={themeClasses.text}>
                  {t("dashboard.invitations.templates.preview", {}, "Preview")}
                </Label>
                <Card className={`${themeClasses.card} p-4 ${themeClasses.border}`}>
                  <div className="space-y-4">
                    <div>
                      <p className={`text-sm ${themeClasses.mutedText} mb-1`}>
                        {t("dashboard.invitations.templates.subject", {}, "Subject:")}
                      </p>
                      <p className={`font-semibold ${themeClasses.text}`}>
                        {replaceVariables(selectedTemplate?.subject || "")}
                      </p>
                    </div>
                    <div className={`${themeClasses.border} border-t pt-4`}>
                      <p className={`text-sm ${themeClasses.mutedText} mb-2`}>
                        {t("dashboard.invitations.templates.body", {}, "Body:")}
                      </p>
                      <div className={`${themeClasses.text} whitespace-pre-wrap`}>
                        {replaceVariables(selectedTemplate?.body || "")}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  className={`flex-1 ${themeClasses.button}`}
                  disabled={selectedTemplate?.id === "custom" && customMessage.trim() === ""}
                >
                  {t("dashboard.invitations.templates.useTemplate", {}, "Use This Template")}
                </Button>
                <Button onClick={onClose} variant="outline" className={themeClasses.button}>
                  {t("common.cancel", {}, "Cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EmailTemplateSelector;
