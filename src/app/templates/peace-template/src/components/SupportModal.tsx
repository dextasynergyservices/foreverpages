import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Heart, DollarSign } from "lucide-react";

interface AccountDetail {
  id: string;
  type: "BANK" | "MOBILE_MONEY" | "PAYPAL" | "STRIPE";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  provider?: string;
  currency: string;
  instructions?: string;
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
    if (!memorialOwner?.id) return;

    try {
      const response = await fetch(`/api/user/account-details?userId=${memorialOwner.id}`);
      if (response.ok) {
        const data = await response.json();
        setAccountDetails(data.accountDetails || []);
        if (data.accountDetails?.length > 0) {
          setSelectedAccount(data.accountDetails[0]);
        }
      }
    } catch (error) {
      console.error("Error loading account details:", error);
    }
  }, [memorialOwner?.id]);

  useEffect(() => {
    if (isOpen) {
      loadAccountDetails();
    }
  }, [isOpen, loadAccountDetails]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleSubmitSupport = async () => {
    if (!memorialId || !selectedAccount || (!selectedAmount && !customAmount)) return;

    setIsLoading(true);
    try {
      const amount = selectedAmount || parseFloat(customAmount);

      await fetch("/api/memorial/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorialId,
          amount,
          currency: selectedCurrency,
          accountType: selectedAccount.type,
          donorName: donorName || "Anonymous",
          message: donationMessage,
        }),
      });

      setSelectedAmount(null);
      setCustomAmount("");
      setDonationMessage("");
      setDonorName("");
      onClose();
    } catch (error) {
      console.error("Error submitting support:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountTypeDisplay = (type: string) => {
    switch (type) {
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
          <button
            onClick={onClose}
            className="rounded-full p-1 text-cream/60 hover:bg-cream/10 hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-cream">Your Name (Optional)</label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Anonymous"
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-cream">Currency</label>
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
            <label className="block text-sm font-medium text-cream">Amount</label>
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
            <input
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
            <label className="block text-sm font-medium text-cream">
              Memorial Message (Optional)
            </label>
            <textarea
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              placeholder="Share a memory or message of support..."
              rows={3}
              className="w-full rounded-lg border border-cream/20 bg-cream/10 px-3 py-2 text-cream placeholder-cream/60 focus:border-soft-gold focus:outline-none focus:ring-2 focus:ring-soft-gold/20"
            />
          </div>

          {accountDetails.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-cream">Payment Method</label>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/80">Account Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream">{selectedAccount.accountName}</span>
                    <button
                      onClick={() => copyToClipboard(selectedAccount.accountName, "name")}
                      className="rounded p-1 hover:bg-cream/10"
                    >
                      {copiedField === "name" ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-cream/60" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/80">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream">{selectedAccount.accountNumber}</span>
                    <button
                      onClick={() => copyToClipboard(selectedAccount.accountNumber, "number")}
                      className="rounded p-1 hover:bg-cream/10"
                    >
                      {copiedField === "number" ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-cream/60" />
                      )}
                    </button>
                  </div>
                </div>
                {selectedAccount.bankName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cream/80">Bank:</span>
                    <span className="text-sm text-cream">{selectedAccount.bankName}</span>
                  </div>
                )}
                {selectedAccount.provider && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cream/80">Provider:</span>
                    <span className="text-sm text-cream">{selectedAccount.provider}</span>
                  </div>
                )}
                {selectedAccount.instructions && (
                  <div className="mt-3 rounded-lg bg-cream/5 p-3">
                    <p className="text-xs text-cream/80">{selectedAccount.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmitSupport}
            disabled={isLoading || !selectedAccount || (!selectedAmount && !customAmount)}
            className="w-full rounded-lg bg-soft-gold py-3 font-semibold text-burgundy transition-all hover:bg-soft-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Complete Donation"}
          </button>

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
