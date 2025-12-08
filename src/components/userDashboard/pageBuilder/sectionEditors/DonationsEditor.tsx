"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { useTheme } from "@/hooks/useTheme";

export interface DonationInfo {
  organizationName?: string;
  description?: string;
  donationUrl?: string;
  mailingAddress?: string;
  contactInfo?: string;
}

export interface DonationsData {
  enabled: boolean;
  organizations: DonationInfo[];
}

interface DonationsEditorProps {
  data: DonationsData;
  onChange: (data: DonationsData) => void;
}

export const DonationsEditor: React.FC<DonationsEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addOrganization = () => {
    const newOrg: DonationInfo = {
      organizationName: "",
      description: "",
      donationUrl: "",
      mailingAddress: "",
      contactInfo: "",
    };
    onChange({ ...data, organizations: [...data.organizations, newOrg] });
  };

  const updateOrganization = (index: number, field: keyof DonationInfo, value: string) => {
    const updatedOrgs = [...data.organizations];
    updatedOrgs[index] = { ...updatedOrgs[index], [field]: value };
    onChange({ ...data, organizations: updatedOrgs });
  };

  const removeOrganization = (index: number) => {
    const updatedOrgs = data.organizations.filter((_, i) => i !== index);
    onChange({ ...data, organizations: updatedOrgs });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Memorial Donations</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Suggest charities or organizations for memorial donations
        </p>
      </div>

      {/* Enable Toggle */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div>
          <p className="font-medium">Enable Memorial Donations</p>
          <p className={`text-sm ${textMuted}`}>Show donation options to visitors</p>
        </div>
        <button
          onClick={() => onChange({ ...data, enabled: !data.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            data.enabled ? "bg-blue-600" : theme === "dark" ? "bg-white/20" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              data.enabled ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {data.enabled && (
        <>
          <button
            onClick={addOrganization}
            className={`w-full py-3 px-4 border-2 border-dashed rounded-lg transition-colors ${
              theme === "dark"
                ? "border-white/10 hover:border-white/20"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            + Add Charity/Organization
          </button>

          <div className="space-y-6">
            {data.organizations.map((org, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border ${
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Organization {index + 1}</h4>
                  <button
                    onClick={() => removeOrganization(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`org-name-${index}`}>Organization Name *</Label>
                    <Input
                      id={`org-name-${index}`}
                      placeholder="American Cancer Society"
                      value={org.organizationName || ""}
                      onChange={(e) =>
                        updateOrganization(index, "organizationName", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor={`org-desc-${index}`}>Description</Label>
                    <Textarea
                      id={`org-desc-${index}`}
                      placeholder="Why this organization was meaningful..."
                      rows={3}
                      value={org.description || ""}
                      onChange={(e) => updateOrganization(index, "description", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`org-url-${index}`}>Donation URL</Label>
                    <Input
                      id={`org-url-${index}`}
                      type="url"
                      placeholder="https://donate.example.org"
                      value={org.donationUrl || ""}
                      onChange={(e) => updateOrganization(index, "donationUrl", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`org-address-${index}`}>Mailing Address (Optional)</Label>
                    <Textarea
                      id={`org-address-${index}`}
                      placeholder="For those who prefer to mail donations"
                      rows={2}
                      value={org.mailingAddress || ""}
                      onChange={(e) => updateOrganization(index, "mailingAddress", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`org-contact-${index}`}>Contact Info (Optional)</Label>
                    <Input
                      id={`org-contact-${index}`}
                      placeholder="Phone or email"
                      value={org.contactInfo || ""}
                      onChange={(e) => updateOrganization(index, "contactInfo", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
