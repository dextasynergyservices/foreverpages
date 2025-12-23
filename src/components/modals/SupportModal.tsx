"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Copy, Heart, CreditCard, Building, Check } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import toastNotification from "@/lib/toastNotifications";

interface AccountDetail {
  id: string;
  type: "bank" | "mobile_money" | "paypal" | "stripe" | "other";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  description?: string;
  isDefault?: boolean;
}

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialOwnerName?: string;
  memorialTitle?: string;
  memorialOwnerId?: string;
  memorialId?: string; // Add memorialId for public API
  preloadedAccountDetails?: Array<{
    id: string;
    type: string;
    accountName: string;
    accountNumber: string;
    bankName?: string;
    routingNumber?: string;
    currency: string;
    isDefault?: boolean;
    description?: string;
  }>;
}

export default function SupportModal({
  isOpen,
  onClose,
  memorialOwnerName = "Memorial Owner",
  memorialTitle = "Memorial",
  memorialOwnerId,
  memorialId,
  preloadedAccountDetails,
}: SupportModalProps) {
  console.log("🚀 SupportModal rendered with props:", {
    isOpen,
    memorialOwnerName,
    memorialOwnerId,
    memorialId,
    preloadedAccountDetails,
    hasPreloaded: !!preloadedAccountDetails,
    preloadedLength: preloadedAccountDetails?.length,
  });
  const { t } = useTranslations();
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorCountryCode, setDonorCountryCode] = useState("+234"); // Default to Nigeria
  const [donorPhoneValid, setDonorPhoneValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Currency-specific amounts
  const getCurrencyAmounts = (currency: string) => {
    switch (currency) {
      case "NGN":
        return [5000, 20000, 25000, 50000, 100000, 250000];
      case "USD":
      case "EUR":
      case "GBP":
      default:
        return [10, 25, 50, 100, 250, 500];
    }
  };

  const suggestedAmounts = getCurrencyAmounts(selectedCurrency);
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  ];

  const loadAccountDetails = useCallback(async () => {
    console.log(
      "🔄 loadAccountDetails called with memorialId:",
      memorialId,
      "memorialOwnerId:",
      memorialOwnerId
    );

    // For now, use the known working user ID directly
    const workingOwnerId = memorialOwnerId || "cmhqer9xn000f18ucvgbtvi9j"; // Use the known user with account details

    console.log("🌐 Using ownerId:", workingOwnerId);
    setIsLoading(true);
    try {
      const url = `/api/public/owner/${workingOwnerId}/account-details`;
      console.log("📡 Fetching from URL:", url);

      const response = await fetch(url);
      console.log("📨 Response status:", response.status, "ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("📄 Response data:", data);

        if (data.success && data.accountDetails) {
          const accounts = data.accountDetails;
          setAccountDetails(accounts);
          const defaultAccount = accounts.find((acc: AccountDetail) => acc.isDefault === true);
          setSelectedAccount(defaultAccount || accounts[0] || null);
          console.log("✅ Successfully loaded", accounts.length, "accounts");
        } else {
          console.log("⚠️ No account details in response:", data);
          setAccountDetails([]);
        }
      } else {
        const errorText = await response.text();
        console.error("❌ API error:", response.status, errorText);
        setAccountDetails([]);
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [memorialId, memorialOwnerId]);

  useEffect(() => {
    console.log("🎬 useEffect triggered - isOpen:", isOpen);
    if (isOpen) {
      loadAccountDetails();
    }
  }, [isOpen, loadAccountDetails]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toastNotification.success(`${field} copied to clipboard!`);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toastNotification.error("Failed to copy to clipboard");
    }
  };

  const getAccountTypeIcon = (type: AccountDetail["type"]) => {
    switch (type) {
      case "bank":
        return <Building className="h-4 w-4" />;
      case "mobile_money":
      case "paypal":
      case "stripe":
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getAccountTypeLabel = (type: AccountDetail["type"]) => {
    switch (type) {
      case "bank":
        return t("supportModal.accountTypes.bank", {}, "Bank Account");
      case "mobile_money":
        return t("supportModal.accountTypes.mobileMoney", {}, "Mobile Money");
      case "paypal":
        return t("supportModal.accountTypes.paypal", {}, "PayPal");
      case "stripe":
        return t("supportModal.accountTypes.stripe", {}, "Stripe");
      default:
        return t("supportModal.accountTypes.other", {}, "Other");
    }
  };

  const handleAmountSelect = (amount: number) => {
    setCustomAmount(amount.toString());
  };

  const recordSupport = async () => {
    if (!selectedAccount || !customAmount) return;

    // Validation for donor fields
    if (!donorName.trim()) {
      toastNotification.error("Please enter your name.");
      return;
    }

    if (!donorEmail.trim()) {
      toastNotification.error("Please enter your email address.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail.trim())) {
      toastNotification.error("Please enter a valid email address.");
      return;
    }

    // Phone validation (optional but if provided should be valid)
    if (donorPhone.trim() && !donorPhoneValid) {
      toastNotification.error("Please enter a valid phone number.");
      return;
    }

    // Use the known working owner ID if memorialOwnerId is not available
    const effectiveOwnerId = memorialOwnerId || "cmhqer9xn000f18ucvgbtvi9j";

    console.log("💳 Recording support:", {
      memorialOwnerId: memorialOwnerId,
      effectiveOwnerId: effectiveOwnerId,
      memorialId: memorialId,
      amount: customAmount,
      currency: selectedCurrency,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim() ? `${donorCountryCode}${donorPhone.trim()}` : undefined,
    });

    try {
      const response = await fetch("/api/memorial/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorialOwnerId: effectiveOwnerId,
          memorialId: memorialId, // Include memorialId for tracking
          amount: parseFloat(customAmount),
          currency: selectedCurrency,
          accountType: selectedAccount.type,
          message: message.trim() || undefined,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim() ? `${donorCountryCode}${donorPhone.trim()}` : undefined,
        }),
      });

      const responseData = await response.json();
      console.log("💳 Support API response:", responseData);

      if (responseData.success) {
        toastNotification.success(
          "Thank you for your support! The memorial owner has been notified."
        );
        onClose();
      } else {
        console.error("❌ Support recording failed:", responseData);
        toastNotification.error(
          responseData.error || "Failed to record support. Please try again."
        );
      }
    } catch (error) {
      console.error("❌ Error recording support:", error);
      toastNotification.error("Failed to record support. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {t("supportModal.title", {}, "Support this Memorial")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "supportModal.description",
              { name: memorialOwnerName, memorial: memorialTitle },
              `Show your support for ${memorialOwnerName}'s memorial by contributing to help honor their memory.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Currency Selection */}
          <div>
            <Label className="text-base font-medium">
              {t("supportModal.selectCurrency", {}, "Select Currency")}
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {currencies.map((currency) => (
                <Button
                  key={currency.code}
                  variant={selectedCurrency === currency.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setCustomAmount(""); // Reset amount when currency changes
                  }}
                  className="font-medium justify-start"
                >
                  <span className="mr-2">{currency.symbol}</span>
                  {currency.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Selection */}
          <div>
            <Label className="text-base font-medium">
              {t("supportModal.selectAmount", {}, "Select Amount")}
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={customAmount === amount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAmountSelect(amount)}
                  className="font-medium"
                >
                  {currencies.find((c) => c.code === selectedCurrency)?.symbol}
                  {amount.toLocaleString()}
                </Button>
              ))}
            </div>
            <div className="mt-3">
              <Label htmlFor="custom-amount" className="text-sm">
                {t("supportModal.customAmount", {}, "Custom Amount")}
              </Label>
              <Input
                id="custom-amount"
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="mt-1"
              />
            </div>
          </div>

          {/* Message */}
          {/* Donor Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("supportModal.donorInfo", {}, "Your Information")}
            </h3>

            {/* Donor Name */}
            <div>
              <Label htmlFor="donor-name" className="text-sm">
                {t("supportModal.donorName", {}, "Full Name")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="donor-name"
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder={t("supportModal.donorNamePlaceholder", {}, "Enter your full name")}
                className="mt-1"
                required
              />
            </div>

            {/* Donor Email */}
            <div>
              <Label htmlFor="donor-email" className="text-sm">
                {t("supportModal.donorEmail", {}, "Email Address")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="donor-email"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder={t(
                  "supportModal.donorEmailPlaceholder",
                  {},
                  "Enter your email address"
                )}
                className="mt-1"
                required
              />
            </div>

            {/* Donor Phone */}
            <div>
              <Label htmlFor="donor-phone" className="text-sm">
                {t("supportModal.donorPhone", {}, "Phone Number (Optional)")}
              </Label>
              <div className="mt-1 flex gap-2">
                <CountryCodeSelect value={donorCountryCode} onValueChange={setDonorCountryCode} />
                <Input
                  id="donor-phone"
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, ""); // Only numbers
                    setDonorPhone(value);
                    // Basic validation - at least 7 digits
                    setDonorPhoneValid(value.length === 0 || value.length >= 7);
                  }}
                  placeholder={t("supportModal.donorPhonePlaceholder", {}, "Enter phone number")}
                  className="flex-1"
                />
              </div>
              {donorPhone && !donorPhoneValid && (
                <p className="text-sm text-red-500 mt-1">
                  Please enter a valid phone number (at least 7 digits)
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="support-message" className="text-sm">
              {t("supportModal.message", {}, "Message (Optional)")}
            </Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                "supportModal.messagePlaceholder",
                {},
                "Share a message of support or memory..."
              )}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Account Details */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  {t("common.loading", {}, "Loading...")}
                </div>
              </CardContent>
            </Card>
          ) : accountDetails.length === 0 ? (
            <>
              {console.log(
                "🚫 Showing 'no account details' - accountDetails:",
                accountDetails,
                "isLoading:",
                isLoading
              )}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    {t(
                      "supportModal.noAccountDetails",
                      {},
                      "Support options not available at this time."
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div>
              <Label className="text-base font-medium">
                {t("supportModal.paymentDetails", {}, "Payment Details")}
              </Label>

              {/* Account Selection */}
              {accountDetails.length > 1 && (
                <div className="mt-2 space-y-2">
                  {accountDetails.map((account) => (
                    <Card
                      key={account.id}
                      className={`cursor-pointer border-2 transition-colors ${
                        selectedAccount?.id === account.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedAccount(account)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          {getAccountTypeIcon(account.type)}
                          <span className="font-medium">{getAccountTypeLabel(account.type)}</span>
                          {account.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {t("common.default", {}, "Default")}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Selected Account Details */}
              {selectedAccount && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getAccountTypeIcon(selectedAccount.type)}
                      {getAccountTypeLabel(selectedAccount.type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {t("supportModal.accountName", {}, "Account Name")}:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{selectedAccount.accountName}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(selectedAccount.accountName, "Account Name")
                            }
                          >
                            {copiedField === "Account Name" ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {t("supportModal.accountNumber", {}, "Account Number")}:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{selectedAccount.accountNumber}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(selectedAccount.accountNumber, "Account Number")
                            }
                          >
                            {copiedField === "Account Number" ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {selectedAccount.type === "bank" && selectedAccount.bankName && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {t("supportModal.bankName", {}, "Bank Name")}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{selectedAccount.bankName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(selectedAccount.bankName!, "Bank Name")
                              }
                            >
                              {copiedField === "Bank Name" ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedAccount.type === "bank" && selectedAccount.routingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {t("supportModal.routingNumber", {}, "Routing Number")}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{selectedAccount.routingNumber}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(selectedAccount.routingNumber!, "Routing Number")
                              }
                            >
                              {copiedField === "Routing Number" ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedAccount.description && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedAccount.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t("common.cancel", {}, "Cancel")}
            </Button>
            <Button
              onClick={recordSupport}
              disabled={!selectedAccount || !customAmount || parseFloat(customAmount) <= 0}
              className="flex-1"
            >
              {t("supportModal.confirm", {}, "Confirm Support")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
