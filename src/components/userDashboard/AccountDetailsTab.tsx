"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  CreditCard,
  Building,
  Smartphone,
  Globe,
  CheckCircle,
  Edit3,
  Star,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import toastNotification from "@/lib/toastNotifications";

interface AccountDetail {
  id: string;
  type: "bank" | "mobile_money" | "paypal" | "paystack" | "stripe" | "other";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  description?: string;
  paymentLink?: string; // New field for payment links
  isDefault: boolean;
}

export default function AccountDetailsTab() {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  // Load account details on component mount
  useEffect(() => {
    loadAccountDetails();
  }, []);

  const loadAccountDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/account-details");
      if (response.ok) {
        const data = await response.json();
        setAccountDetails(data.accountDetails || []);
      }
    } catch (error) {
      console.error("Error loading account details:", error);
      toastNotification.error("Failed to load account details");
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccountDetails = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/account-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountDetails }),
      });

      if (response.ok) {
        toastNotification.success("Account details saved successfully");
      } else {
        throw new Error("Failed to save account details");
      }
    } catch (error) {
      console.error("Error saving account details:", error);
      toastNotification.error("Failed to save account details");
    } finally {
      setIsSaving(false);
    }
  };

  const addNewAccount = () => {
    const newAccount: AccountDetail = {
      id: `account_${Date.now()}`,
      type: "bank",
      accountName: "",
      accountNumber: "",
      description: "",
      paymentLink: "",
      isDefault: accountDetails.length === 0, // First account is default
    };
    setAccountDetails([...accountDetails, newAccount]);
  };

  const removeAccount = (id: string) => {
    setAccountDetails(accountDetails.filter((account) => account.id !== id));
  };

  const updateAccount = (id: string, updates: Partial<AccountDetail>) => {
    setAccountDetails(
      accountDetails.map((account) => (account.id === id ? { ...account, ...updates } : account))
    );
  };

  const setDefaultAccount = (id: string) => {
    setAccountDetails(
      accountDetails.map((account) => ({
        ...account,
        isDefault: account.id === id,
      }))
    );
  };

  const toggleEditMode = (accountId: string) => {
    setEditingAccount(editingAccount === accountId ? null : accountId);
  };

  const saveAccount = async (accountId: string) => {
    setIsSaving(true);
    try {
      // Here you could save individual account instead of all accounts
      // For now, we'll save all accounts
      console.log("Saving account:", accountId);
      await saveAccountDetails();
      setEditingAccount(null);
      toastNotification.success(
        t("dashboard.settings.accountDetails.accountSaved", {}, "Account saved successfully")
      );
    } catch (error) {
      console.error("Failed to save account:", error);
      toastNotification.error(
        t("dashboard.settings.accountDetails.saveFailed", {}, "Failed to save account")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getAccountTypeIcon = (type: AccountDetail["type"]) => {
    switch (type) {
      case "bank":
        return <Building className="h-5 w-5" />;
      case "mobile_money":
        return <Smartphone className="h-5 w-5" />;
      case "paypal":
        return <Globe className="h-5 w-5" />;
      case "paystack":
        return <CreditCard className="h-5 w-5" />;
      case "stripe":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getAccountTypeColor = (type: AccountDetail["type"]) => {
    switch (type) {
      case "bank":
        return "bg-blue-500";
      case "mobile_money":
        return "bg-green-500";
      case "paypal":
        return "bg-purple-500";
      case "paystack":
        return "bg-orange-500";
      case "stripe":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAccountTypeName = (type: AccountDetail["type"]) => {
    switch (type) {
      case "bank":
        return t("dashboard.settings.accountDetails.types.bank", {}, "Bank Account");
      case "mobile_money":
        return t("dashboard.settings.accountDetails.types.mobileMoney", {}, "Mobile Money");
      case "paypal":
        return t("dashboard.settings.accountDetails.types.paypal", {}, "PayPal");
      case "paystack":
        return t("dashboard.settings.accountDetails.types.paystack", {}, "Paystack");
      case "stripe":
        return t("dashboard.settings.accountDetails.types.stripe", {}, "Stripe");
      case "other":
        return t("dashboard.settings.accountDetails.types.other", {}, "Other");
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <Card
        className={`${theme === "dark" ? "bg-gray-900/50 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"}`}
            >
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            {t("dashboard.settings.accountDetails.title", {}, "Account Details")}
          </CardTitle>
          <CardDescription>
            {t(
              "dashboard.settings.accountDetails.description",
              {},
              "Manage your account details for receiving donations and support through your memorial pages."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Details List */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          ) : accountDetails.length === 0 ? (
            <div
              className={`text-center py-12 px-6 rounded-xl border-2 border-dashed ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-600 text-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-600"
              }`}
            >
              <div
                className={`inline-flex p-4 rounded-full mb-4 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {t("dashboard.settings.accountDetails.noAccountsTitle", {}, "No Accounts Added")}
              </h3>
              <p className="max-w-md mx-auto mb-6">
                {t(
                  "dashboard.settings.accountDetails.noAccounts",
                  {},
                  "Add your account details to receive donations and support through your memorial pages."
                )}
              </p>
              <Button onClick={addNewAccount} className="px-6">
                <Plus className="h-4 w-4 mr-2" />
                {t(
                  "dashboard.settings.accountDetails.addFirstAccount",
                  {},
                  "Add Your First Account"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accountDetails.map((account, index) => (
                <Card
                  key={account.id}
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border ${
                    account.isDefault
                      ? theme === "dark"
                        ? "border-blue-500/50 bg-blue-900/20"
                        : "border-blue-300 bg-blue-50"
                      : theme === "dark"
                        ? "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                        : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {account.isDefault && (
                    <div className="absolute top-0 right-0">
                      <div
                        className={`px-3 py-1 text-xs font-medium text-white ${
                          theme === "dark" ? "bg-blue-600" : "bg-blue-500"
                        } rounded-bl-lg`}
                      >
                        <Star className="h-3 w-3 inline mr-1" />
                        {t("dashboard.settings.accountDetails.default", {}, "Primary")}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Account Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-full ${getAccountTypeColor(account.type)} text-white`}
                        >
                          {getAccountTypeIcon(account.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              {account.accountName || `Account ${index + 1}`}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {getAccountTypeName(account.type)}
                            </Badge>
                          </div>
                          <p
                            className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {account.accountNumber
                              ? `••••${account.accountNumber.slice(-4)}`
                              : "No account number"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingAccount === account.id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveAccount(account.id)}
                            disabled={isSaving}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isSaving
                              ? t("common.saving", {}, "Saving...")
                              : t("common.save", {}, "Save")}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleEditMode(account.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            {t("common.edit", {}, "Edit")}
                          </Button>
                        )}

                        {!account.isDefault && accountDetails.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultAccount(account.id)}
                            className="text-xs"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {t("dashboard.settings.accountDetails.setPrimary", {}, "Set Primary")}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAccount(account.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Account Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor={`type-${account.id}`}
                            className="flex items-center gap-2 mb-2"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {t("dashboard.settings.accountDetails.type", {}, "Account Type")}
                          </Label>
                          {editingAccount === account.id ? (
                            <Select
                              value={account.type}
                              onValueChange={(value) =>
                                updateAccount(account.id, { type: value as AccountDetail["type"] })
                              }
                            >
                              <SelectTrigger id={`type-${account.id}`} className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bank" className="flex items-center gap-2">
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-blue-100 text-blue-600">
                                      <Building className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {t(
                                          "dashboard.settings.accountDetails.types.bank",
                                          {},
                                          "Bank Account"
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {t(
                                          "dashboard.settings.accountDetails.types.bankDesc",
                                          {},
                                          "Traditional bank account"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="mobile_money"
                                  className="flex items-center gap-2"
                                >
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-green-100 text-green-600">
                                      <Smartphone className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {t(
                                          "dashboard.settings.accountDetails.types.mobileMoney",
                                          {},
                                          "Mobile Money"
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {t(
                                          "dashboard.settings.accountDetails.types.mobileMoneyDesc",
                                          {},
                                          "Mobile payment service"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="paypal" className="flex items-center gap-2">
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-purple-100 text-purple-600">
                                      <Globe className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {t(
                                          "dashboard.settings.accountDetails.types.paypal",
                                          {},
                                          "PayPal"
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {t(
                                          "dashboard.settings.accountDetails.types.paypalDesc",
                                          {},
                                          "PayPal digital wallet"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="paystack" className="flex items-center gap-2">
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-orange-100 text-orange-600">
                                      <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {t(
                                          "dashboard.settings.accountDetails.types.paystack",
                                          {},
                                          "Paystack"
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {t(
                                          "dashboard.settings.accountDetails.types.paystackDesc",
                                          {},
                                          "Paystack payment platform"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="stripe" className="flex items-center gap-2">
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-indigo-100 text-indigo-600">
                                      <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {t(
                                          "dashboard.settings.accountDetails.types.stripe",
                                          {},
                                          "Stripe"
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {t(
                                          "dashboard.settings.accountDetails.types.stripeDesc",
                                          {},
                                          "Stripe payment platform"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                                <SelectItem value="other">
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                                      <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {t(
                                          "dashboard.settings.accountDetails.types.other",
                                          {},
                                          "Other"
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {t(
                                          "dashboard.settings.accountDetails.types.otherDesc",
                                          {},
                                          "Other payment method"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div
                              className={`h-11 px-3 py-2 border rounded-md flex items-center ${
                                theme === "dark"
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-gray-50 border-gray-300"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {getAccountTypeIcon(account.type)}
                                {getAccountTypeName(account.type)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`name-${account.id}`} className="mb-2 block">
                            {t(
                              "dashboard.settings.accountDetails.accountName",
                              {},
                              "Account Holder Name"
                            )}
                          </Label>
                          {editingAccount === account.id ? (
                            <Input
                              id={`name-${account.id}`}
                              value={account.accountName}
                              onChange={(e) =>
                                updateAccount(account.id, { accountName: e.target.value })
                              }
                              placeholder="John Doe"
                              className="h-11"
                            />
                          ) : (
                            <div
                              className={`h-11 px-3 py-2 border rounded-md flex items-center ${
                                theme === "dark"
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-gray-50 border-gray-300"
                              }`}
                            >
                              {account.accountName || "No name provided"}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor={`number-${account.id}`}
                            className="mb-2 flex items-center gap-2"
                          >
                            {t(
                              "dashboard.settings.accountDetails.accountNumber",
                              {},
                              "Account Number"
                            )}
                            {(account.type === "paypal" ||
                              account.type === "paystack" ||
                              account.type === "stripe" ||
                              account.type === "other") && (
                              <Badge variant="secondary" className="text-xs">
                                {t("common.optional", {}, "Optional")}
                              </Badge>
                            )}
                          </Label>
                          {editingAccount === account.id ? (
                            <Input
                              id={`number-${account.id}`}
                              value={account.accountNumber}
                              onChange={(e) =>
                                updateAccount(account.id, { accountNumber: e.target.value })
                              }
                              placeholder={
                                account.type === "paypal"
                                  ? "your-email@example.com or business ID"
                                  : account.type === "paystack"
                                    ? "Business name or account identifier"
                                    : account.type === "stripe"
                                      ? "Account ID or business identifier"
                                      : "1234567890"
                              }
                              className="h-11"
                            />
                          ) : (
                            <div
                              className={`h-11 px-3 py-2 border rounded-md flex items-center ${
                                theme === "dark"
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-gray-50 border-gray-300"
                              }`}
                            >
                              {account.accountNumber
                                ? account.type === "bank" || account.type === "mobile_money"
                                  ? `••••${account.accountNumber.slice(-4)}`
                                  : account.accountNumber
                                : "No account number"}
                            </div>
                          )}
                        </div>

                        {account.type === "bank" && (
                          <>
                            <div>
                              <Label htmlFor={`bank-${account.id}`} className="mb-2 block">
                                {t("dashboard.settings.accountDetails.bankName", {}, "Bank Name")}
                              </Label>
                              {editingAccount === account.id ? (
                                <Input
                                  id={`bank-${account.id}`}
                                  value={account.bankName || ""}
                                  onChange={(e) =>
                                    updateAccount(account.id, { bankName: e.target.value })
                                  }
                                  placeholder="Chase Bank"
                                  className="h-11"
                                />
                              ) : (
                                <div
                                  className={`h-11 px-3 py-2 border rounded-md flex items-center ${
                                    theme === "dark"
                                      ? "bg-gray-800 border-gray-700"
                                      : "bg-gray-50 border-gray-300"
                                  }`}
                                >
                                  {account.bankName || "No bank name provided"}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor={`routing-${account.id}`} className="mb-2 block">
                                {t(
                                  "dashboard.settings.accountDetails.routingNumber",
                                  {},
                                  "Routing Number"
                                )}
                              </Label>
                              {editingAccount === account.id ? (
                                <Input
                                  id={`routing-${account.id}`}
                                  value={account.routingNumber || ""}
                                  onChange={(e) =>
                                    updateAccount(account.id, { routingNumber: e.target.value })
                                  }
                                  placeholder="123456789"
                                  className="h-11"
                                />
                              ) : (
                                <div
                                  className={`h-11 px-3 py-2 border rounded-md flex items-center ${
                                    theme === "dark"
                                      ? "bg-gray-800 border-gray-700"
                                      : "bg-gray-50 border-gray-300"
                                  }`}
                                >
                                  {account.routingNumber || "No routing number provided"}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Payment Link Section - Show for PayPal, Paystack, Stripe, and Other */}
                      {(account.type === "paypal" ||
                        account.type === "paystack" ||
                        account.type === "stripe" ||
                        account.type === "other") && (
                        <div className="mt-4">
                          <Label
                            htmlFor={`payment-link-${account.id}`}
                            className="flex items-center gap-2 mb-2"
                          >
                            <Globe className="h-4 w-4" />
                            {t("dashboard.settings.accountDetails.paymentLink", {}, "Payment Link")}
                            <Badge variant="secondary" className="text-xs">
                              {t("common.optional", {}, "Optional")}
                            </Badge>
                          </Label>
                          {editingAccount === account.id ? (
                            <Input
                              id={`payment-link-${account.id}`}
                              type="url"
                              value={account.paymentLink || ""}
                              onChange={(e) =>
                                updateAccount(account.id, { paymentLink: e.target.value })
                              }
                              placeholder={
                                account.type === "paypal"
                                  ? "https://paypal.me/yourusername"
                                  : account.type === "paystack"
                                    ? "https://paystack.com/pay/yourbusinessname"
                                    : account.type === "stripe"
                                      ? "https://buy.stripe.com/yourlinkid"
                                      : "https://your-payment-link.com"
                              }
                              className="h-11"
                            />
                          ) : (
                            <div
                              className={`h-11 px-3 py-2 border rounded-md flex items-center ${
                                theme === "dark"
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-gray-50 border-gray-300"
                              }`}
                            >
                              {account.paymentLink ? (
                                <a
                                  href={account.paymentLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
                                >
                                  {account.paymentLink}
                                </a>
                              ) : (
                                "No payment link provided"
                              )}
                            </div>
                          )}
                          <p
                            className={`text-xs mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {account.type === "paypal" &&
                              t(
                                "dashboard.settings.accountDetails.paymentLinkHelp.paypal",
                                {},
                                "Supporters can use this link to send donations directly via PayPal"
                              )}
                            {account.type === "paystack" &&
                              t(
                                "dashboard.settings.accountDetails.paymentLinkHelp.paystack",
                                {},
                                "Supporters can use this link to donate through Paystack payment gateway"
                              )}
                            {account.type === "stripe" &&
                              t(
                                "dashboard.settings.accountDetails.paymentLinkHelp.stripe",
                                {},
                                "Supporters can use this link to donate through Stripe payment processing"
                              )}
                            {account.type === "other" &&
                              t(
                                "dashboard.settings.accountDetails.paymentLinkHelp.other",
                                {},
                                "Supporters can use this link for donations through your custom payment method"
                              )}
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <Label htmlFor={`description-${account.id}`} className="mb-2 block">
                          {t(
                            "dashboard.settings.accountDetails.description",
                            {},
                            "Description (Optional)"
                          )}
                        </Label>
                        {editingAccount === account.id ? (
                          <Textarea
                            id={`description-${account.id}`}
                            value={account.description || ""}
                            onChange={(e) =>
                              updateAccount(account.id, { description: e.target.value })
                            }
                            placeholder="Additional details about this account..."
                            rows={3}
                            className="resize-none"
                          />
                        ) : (
                          <div
                            className={`min-h-[80px] p-3 border rounded-md ${
                              theme === "dark"
                                ? "bg-gray-800 border-gray-700"
                                : "bg-gray-50 border-gray-300"
                            }`}
                          >
                            {account.description || "No additional description provided"}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              onClick={addNewAccount}
              variant="outline"
              className="flex-1 h-12 border-dashed border-2"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t("dashboard.settings.accountDetails.addAccount", {}, "Add New Account")}
            </Button>

            {accountDetails.length > 0 && (
              <Button
                onClick={saveAccountDetails}
                disabled={isSaving}
                className="flex-1 sm:flex-none sm:min-w-[140px] h-12"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    {t("common.saving", {}, "Saving...")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("common.save", {}, "Save Changes")}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
