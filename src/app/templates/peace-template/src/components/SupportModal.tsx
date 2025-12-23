import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Heart, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
interface AccountDetail {
  id: string;
  type:
    | "BANK"
    | "MOBILE_MONEY"
    | "PAYPAL"
    | "STRIPE"
    | "bank"
    | "mobile_money"
    | "paypal"
    | "stripe";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  provider?: string;
  currency: string;
  instructions?: string;
  isDefault?: boolean;
  description?: string;
}

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialOwner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    accountDetails?: AccountDetail[];
  } | null;
  memorialId?: string;
}

const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  memorialOwner,
  memorialId,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [donationMessage, setDonationMessage] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState(""); // Will store the full international number
  const [donorCountryCode, setDonorCountryCode] = useState("+234"); // Default to Nigeria
  const [donorPhoneValid, setDonorPhoneValid] = useState(true);
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

  const predefinedAmounts = getCurrencyAmounts(selectedCurrency);
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  ];

  const loadAccountDetails = useCallback(async () => {
    console.log(
      "🔄 Peace template loadAccountDetails called with memorialOwner.id:",
      memorialOwner?.id,
      "memorialId:",
      memorialId
    );

    // For now, use the known working user ID as fallback
    const workingOwnerId = memorialOwner?.id || "cmhqer9xn000f18ucvgbtvi9j"; // Use the known user with account details

    console.log("🌐 Peace template using ownerId:", workingOwnerId);
    setIsLoading(true);
    try {
      const url = `/api/public/owner/${workingOwnerId}/account-details`;
      console.log("📡 Peace template fetching from URL:", url);

      const response = await fetch(url);
      console.log("📨 Peace template response status:", response.status, "ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("📄 Peace template response data:", data);

        if (data.success && data.accountDetails) {
          const accounts = data.accountDetails;
          setAccountDetails(accounts);
          const defaultAccount = accounts.find((acc: AccountDetail) => acc.isDefault === true);
          setSelectedAccount(defaultAccount || accounts[0] || null);
          console.log("✅ Peace template successfully loaded", accounts.length, "accounts");
        } else {
          console.log("⚠️ Peace template no account details in response:", data);
          setAccountDetails([]);
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Peace template API error:", response.status, errorText);
        setAccountDetails([]);
      }
    } catch (error) {
      console.error("❌ Peace template fetch error:", error);
      setAccountDetails([]);
    } finally {
      setIsLoading(false);
    }
  }, [memorialOwner?.id, memorialId]);

  useEffect(() => {
    if (isOpen) {
      loadAccountDetails();
    }
  }, [isOpen, loadAccountDetails]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSubmitSupport = async () => {
    if (!selectedAccount || (!selectedAmount && !customAmount)) return;

    // Validation for donor fields
    if (!donorName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!donorEmail.trim()) {
      alert("Please enter your email address.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    // Phone validation (optional but if provided should be valid)
    if (donorPhone.trim() && !donorPhoneValid) {
      alert("Please enter a valid phone number.");
      return;
    }

    setIsLoading(true);

    // Use the known working owner ID as fallback
    const effectiveOwnerId = memorialOwner?.id || "cmhqer9xn000f18ucvgbtvi9j";

    console.log("💳 Peace template recording support:", {
      memorialId: memorialId,
      memorialOwnerId: memorialOwner?.id,
      effectiveOwnerId: effectiveOwnerId,
      amount: selectedAmount || parseFloat(customAmount),
      currency: selectedCurrency,
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim(),
      donorPhone: donorPhone.trim() ? `${donorCountryCode}${donorPhone.trim()}` : undefined,
    });

    try {
      const amount = selectedAmount || parseFloat(customAmount);

      const response = await fetch("/api/memorial/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorialOwnerId: effectiveOwnerId, // Fixed: use memorialOwnerId instead of memorialId
          memorialId, // Keep memorialId for tracking
          amount,
          currency: selectedCurrency,
          accountType: selectedAccount.type,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim() ? `${donorCountryCode}${donorPhone.trim()}` : undefined,
          message: donationMessage,
        }),
      });

      const responseData = await response.json();
      console.log("💳 Peace template support API response:", responseData);

      if (responseData.success) {
        setSelectedAmount(null);
        setCustomAmount("");
        setDonationMessage("");
        setDonorName("");
        setDonorEmail("");
        setDonorPhone("");
        setDonorCountryCode("+234"); // Reset to default
        onClose();
        // Add success notification here if available
      } else {
        console.error("❌ Peace template support recording failed:", responseData);
      }
    } catch (error) {
      console.error("❌ Peace template error submitting support:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountTypeDisplay = (type: string) => {
    const upperType = type.toUpperCase();
    switch (upperType) {
      case "BANK":
        return "Bank Account";
      case "MOBILE_MONEY":
        return "Mobile Money";
      case "PAYPAL":
        return "PayPal";
      case "STRIPE":
        return "Credit Card";
      default:
        return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-cream/20 bg-gradient-to-br from-burgundy/95 to-deep-plum/95 p-6 shadow-2xl backdrop-blur-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-soft-gold/20 p-2">
              <Heart className="h-5 w-5 text-soft-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cream">Support Memorial</h2>
              <p className="text-sm text-cream/80">Honor their memory with a donation</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full p-1 text-cream/60 hover:bg-cream/10 hover:text-cream"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-cream">
              Your Name <span className="text-red-400">*</span>
            </Label>
            <Input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="block text-sm font-medium text-cream">
              Email Address <span className="text-red-400">*</span>
            </Label>
            <Input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="block text-sm font-medium text-cream">Phone Number (Optional)</Label>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={donorCountryCode}
                onValueChange={setDonorCountryCode}
                variant="peace-template"
              />
              <Input
                type="tel"
                value={donorPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, ""); // Only numbers
                  setDonorPhone(value);
                  // Basic validation - at least 7 digits
                  setDonorPhoneValid(value.length === 0 || value.length >= 7);
                }}
                placeholder="Enter phone number"
                className="flex-1 rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
              />
            </div>
            {donorPhone && !donorPhoneValid && (
              <p className="text-sm text-red-400 mt-1">
                Please enter a valid phone number (at least 7 digits)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="block text-sm font-medium text-cream">Currency</Label>
            <div className="grid grid-cols-2 gap-2">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setSelectedAmount(null); // Reset amount when currency changes
                    setCustomAmount("");
                  }}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedCurrency === currency.code
                      ? "border-soft-gold bg-soft-gold/10 text-cream"
                      : "border-cream/20 bg-cream/5 text-cream hover:border-soft-gold/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currency.symbol}</span>
                    <div>
                      <div className="text-sm font-medium">{currency.code}</div>
                      <div className="text-xs opacity-80">{currency.name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="block text-sm font-medium text-cream">Amount</Label>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`rounded-lg border py-2 text-sm font-medium transition-all ${
                    selectedAmount === amount
                      ? "border-soft-gold bg-soft-gold text-burgundy"
                      : "border-cream/20 bg-cream/10 text-cream hover:border-soft-gold/50"
                  }`}
                >
                  {currencies.find((c) => c.code === selectedCurrency)?.symbol}
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Custom amount"
              min="1"
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
            />
          </div>

          <div className="space-y-3">
            <Label className="block text-sm font-medium text-cream">
              Memorial Message (Optional)
            </Label>
            <Textarea
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              placeholder="Share a memory or message of support..."
              rows={3}
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
            />
          </div>

          {accountDetails.length > 0 && (
            <div className="space-y-3">
              <Label className="block text-sm font-medium text-cream">Payment Method</Label>
              <div className="space-y-2">
                {accountDetails.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedAccount?.id === account.id
                        ? "border-soft-gold bg-soft-gold/10"
                        : "border-cream/20 bg-cream/5 hover:border-soft-gold/50"
                    }`}
                  >
                    <div className="font-medium text-cream">
                      {getAccountTypeDisplay(account.type)}
                    </div>
                    <div className="text-sm text-cream/80">
                      {account.accountName} • {account.currency}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedAccount && (
            <div className="rounded-lg border border-soft-gold/20 bg-soft-gold/5 p-4">
              <h3 className="mb-3 font-semibold text-cream">Payment Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/80">Account Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream font-mono">
                      {selectedAccount.accountName}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedAccount.accountName, "Account Name")}
                      className="rounded p-1 hover:bg-cream/10 transition-colors"
                    >
                      {copiedField === "Account Name" ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-cream/60 hover:text-cream" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/80">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream font-mono">
                      {selectedAccount.accountNumber}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(selectedAccount.accountNumber, "Account Number")
                      }
                      className="rounded p-1 hover:bg-cream/10 transition-colors"
                    >
                      {copiedField === "Account Number" ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-cream/60 hover:text-cream" />
                      )}
                    </button>
                  </div>
                </div>

                {selectedAccount.bankName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cream/80">Bank Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cream font-mono">
                        {selectedAccount.bankName}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedAccount.bankName!, "Bank Name")}
                        className="rounded p-1 hover:bg-cream/10 transition-colors"
                      >
                        {copiedField === "Bank Name" ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-cream/60 hover:text-cream" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedAccount.type === "BANK" || selectedAccount.type === "bank") &&
                  selectedAccount.routingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cream/80">Routing Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-cream font-mono">
                          {selectedAccount.routingNumber}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(selectedAccount.routingNumber!, "Routing Number")
                          }
                          className="rounded p-1 hover:bg-cream/10 transition-colors"
                        >
                          {copiedField === "Routing Number" ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-cream/60 hover:text-cream" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                {selectedAccount.provider && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cream/80">Provider:</span>
                    <span className="text-sm text-cream">{selectedAccount.provider}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/80">Currency:</span>
                  <span className="text-sm text-cream">{selectedAccount.currency}</span>
                </div>

                {(selectedAccount.instructions || selectedAccount.description) && (
                  <div className="mt-3 pt-3 border-t border-cream/20">
                    <p className="text-xs text-cream/80">
                      {selectedAccount.instructions || selectedAccount.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmitSupport}
            disabled={isLoading || !selectedAccount || (!selectedAmount && !customAmount)}
            className="w-full rounded-lg bg-soft-gold py-3 font-semibold text-burgundy transition-all hover:bg-soft-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Complete Donation"}
          </Button>

          <p className="text-xs text-cream/60 text-center">
            Your donation will be sent directly to the memorial owner's account. Forever Pages does
            not process payments directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
