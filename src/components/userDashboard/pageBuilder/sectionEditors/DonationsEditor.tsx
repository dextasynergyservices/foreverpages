"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import {
  Building,
  CreditCard,
  Smartphone,
  Globe,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// Account detail from user settings
interface AccountDetail {
  id: string;
  type: "bank" | "mobile_money" | "paypal" | "paystack" | "stripe" | "other";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  description?: string;
  paymentLink?: string;
  isDefault: boolean;
}

// Selected account for donations (reference to user's account details)
export interface SelectedDonationAccount {
  accountId: string; // References the account in user settings
  enabled: boolean;
  customMessage?: string; // Optional custom message for this account
}

export interface DonationsData {
  // Section content fields
  title?: string;
  subtitle?: string;
  description?: string;
  // Structure fields
  enabled: boolean;
  selectedAccounts?: SelectedDonationAccount[]; // Which accounts from settings to show
  showSupportButton?: boolean; // Whether to show the "Send Support" button
  // Legacy fields (for backwards compatibility)
  organizations?: Array<{
    organizationName?: string;
    description?: string;
    donationUrl?: string;
    mailingAddress?: string;
    contactInfo?: string;
  }>;
}

interface DonationsEditorProps {
  data: DonationsData;
  onChange: (data: DonationsData) => void;
}

const getAccountIcon = (type: string) => {
  switch (type) {
    case "bank":
      return <Building className="h-4 w-4" />;
    case "mobile_money":
      return <Smartphone className="h-4 w-4" />;
    case "paypal":
    case "paystack":
    case "stripe":
      return <CreditCard className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
};

const getAccountTypeLabel = (type: string) => {
  switch (type) {
    case "bank":
      return "Bank Account";
    case "mobile_money":
      return "Mobile Money";
    case "paypal":
      return "PayPal";
    case "paystack":
      return "Paystack";
    case "stripe":
      return "Stripe";
    default:
      return "Other";
  }
};

export const DonationsEditor: React.FC<DonationsEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize selectedAccounts if not present
  const selectedAccounts = data.selectedAccounts || [];

  // Fetch user's account details from settings
  useEffect(() => {
    const fetchAccountDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/user/account-details");
        if (response.ok) {
          const result = await response.json();
          setAccountDetails(result.accountDetails || []);
        } else {
          setError("Failed to load account details");
        }
      } catch (err) {
        console.error("Error fetching account details:", err);
        setError("Failed to load account details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountDetails();
  }, []);

  // Toggle account selection
  const toggleAccountSelection = (accountId: string) => {
    const existingIndex = selectedAccounts.findIndex((sa) => sa.accountId === accountId);

    if (existingIndex >= 0) {
      // Remove account
      const updated = selectedAccounts.filter((sa) => sa.accountId !== accountId);
      onChange({ ...data, selectedAccounts: updated });
    } else {
      // Add account
      const newSelection: SelectedDonationAccount = {
        accountId,
        enabled: true,
      };
      onChange({ ...data, selectedAccounts: [...selectedAccounts, newSelection] });
    }
  };

  // Check if an account is selected
  const isAccountSelected = (accountId: string) => {
    return selectedAccounts.some((sa) => sa.accountId === accountId);
  };

  // Update custom message for an account
  const updateAccountMessage = (accountId: string, message: string) => {
    const updated = selectedAccounts.map((sa) =>
      sa.accountId === accountId ? { ...sa, customMessage: message } : sa
    );
    onChange({ ...data, selectedAccounts: updated });
  };

  // Get custom message for an account
  const getAccountMessage = (accountId: string) => {
    const account = selectedAccounts.find((sa) => sa.accountId === accountId);
    return account?.customMessage || "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Support & Donations</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Allow visitors to support the family through donations
        </p>
      </div>

      {/* Section Content */}
      <div
        className={`space-y-4 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}
      >
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Section Content</h4>
        <div>
          <Label htmlFor="donation-title">Section Title</Label>
          <Input
            id="donation-title"
            placeholder="Support the Family"
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="donation-subtitle">Subtitle</Label>
          <Input
            id="donation-subtitle"
            placeholder="Your contributions make a difference"
            value={data.subtitle || ""}
            onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="donation-description">Description</Label>
          <Textarea
            id="donation-description"
            placeholder="During this difficult time, your support means the world to the family..."
            rows={3}
            value={data.description || ""}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
          />
        </div>
      </div>

      {/* Enable Toggle */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div>
          <p className="font-medium">Enable Donations Section</p>
          <p className={`text-sm ${textMuted}`}>Show donation/support section on the memorial</p>
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
          {/* Show Support Button Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border ${
              theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div>
              <p className="font-medium">Show Support Button</p>
              <p className={`text-sm ${textMuted}`}>
                Display a button that opens payment options modal
              </p>
            </div>
            <button
              onClick={() => onChange({ ...data, showSupportButton: !data.showSupportButton })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                data.showSupportButton
                  ? "bg-blue-600"
                  : theme === "dark"
                    ? "bg-white/20"
                    : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  data.showSupportButton ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Account Details Section */}
          <div
            className={`p-4 rounded-lg border ${
              theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Payment Accounts</h4>
                <p className={`text-sm ${textMuted}`}>
                  Select which accounts from your settings to display
                </p>
              </div>
              <Link
                href="/dashboard/settings?tab=account"
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                Manage Accounts
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-400">Loading accounts...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-red-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            ) : accountDetails.length === 0 ? (
              <div
                className={`text-center py-8 border-2 border-dashed rounded-lg ${
                  theme === "dark" ? "border-white/10" : "border-gray-200"
                }`}
              >
                <Building className={`h-10 w-10 mx-auto mb-3 ${textMuted}`} />
                <p className={textMuted}>No payment accounts set up</p>
                <p className={`text-xs mt-1 ${textMuted}`}>
                  Add accounts in Settings → Account Details
                </p>
                <Link href="/dashboard/settings?tab=account">
                  <Button variant="outline" size="sm" className="mt-4">
                    Set Up Accounts
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {accountDetails.map((account) => {
                  const isSelected = isAccountSelected(account.id);
                  return (
                    <div
                      key={account.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? theme === "dark"
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-blue-500 bg-blue-50"
                          : theme === "dark"
                            ? "border-white/10 hover:border-white/20"
                            : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleAccountSelection(account.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              theme === "dark" ? "bg-white/10" : "bg-gray-100"
                            }`}
                          >
                            {getAccountIcon(account.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{account.accountName}</span>
                              {account.isDefault && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${textMuted}`}>
                              {getAccountTypeLabel(account.type)}
                              {account.bankName && ` • ${account.bankName}`}
                            </p>
                            {account.description && (
                              <p className={`text-xs mt-1 ${textMuted}`}>{account.description}</p>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : theme === "dark"
                                ? "border-white/20"
                                : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>

                      {/* Custom message for selected account */}
                      {isSelected && (
                        <div
                          className="mt-3 pt-3 border-t border-current/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Label className="text-xs">Custom message (optional)</Label>
                          <Input
                            placeholder="Add a note about this payment method..."
                            value={getAccountMessage(account.id)}
                            onChange={(e) => updateAccountMessage(account.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected accounts summary */}
          {selectedAccounts.length > 0 && (
            <div
              className={`p-3 rounded-lg ${
                theme === "dark" ? "bg-green-500/10" : "bg-green-50"
              } border ${theme === "dark" ? "border-green-500/20" : "border-green-200"}`}
            >
              <p className="text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4 inline mr-1" />
                {selectedAccounts.length} payment
                {selectedAccounts.length > 1 ? " methods" : " method"} will be shown to visitors
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
