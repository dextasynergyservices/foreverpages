"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Currency } from "@/components/CurrencySelector";

/**
 * Paystack PopupHandler interface
 */
interface PaystackPopupHandler {
  openIframe: () => void;
}

/**
 * Paystack response interface
 */
interface PaystackResponse {
  reference: string;
  trans?: string;
  status?: string;
  message?: string;
}

/**
 * PaystackPop setup interface
 */
interface PaystackPopSetup {
  key: string;
  email: string;
  amount: number;
  ref: string;
  onClose: () => void;
  callback: (response: PaystackResponse) => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackPopSetup) => PaystackPopupHandler;
    };
  }
}

/**
 * Payment Initialization Response (matches /api/payment/initialize)
 */
interface PaymentInitResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  paymentId?: string;
  sessionId?: string;
  error?: string;
}

/**
 * PaystackButton Component Props
 */
interface PaystackButtonProps {
  planId?: string; // For plan payments
  renewalSlug?: string; // For renewal (lifetime) payments
  subscriptionId?: string; // Required for renewal payments
  amount: number;
  currency: Currency;
  email?: string;
  metadata?: Record<string, unknown>; // Additional metadata for payment
  onSuccess?: (reference: string) => void;
  onClose?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * PaystackButton Component
 *
 * Handles Paystack payment integration with multi-currency support
 *
 * Flow:
 * 1. Initialize payment via /api/payment/initialize
 * 2. Get payment reference and Paystack public key
 * 3. Open Paystack popup with payment options
 * 4. Handle success: Store reference, redirect to signup
 * 5. Handle close: Log abandonment
 *
 * Features:
 * - Multi-currency support (NGN, USD, GBP, EUR)
 * - Payment initialization with API
 * - Success callback with reference storage
 * - Error handling and loading states
 * - Payment abandonment tracking
 *
 * @example
 * ```tsx
 * <PaystackButton
 *   planId="premium"
 *   planName="Premium Plan"
 *   amount={5000}
 *   currency="NGN"
 *   email="user@example.com"
 *   onSuccess={(ref) => console.log("Payment successful:", ref)}
 * />
 * ```
 */
export default function PaystackButton({
  planId,
  renewalSlug,
  subscriptionId,
  amount,
  currency,
  email = "",
  onSuccess,
  onClose,
  disabled = false,
  className,
  children = "Pay Now",
}: PaystackButtonProps) {
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Paystack inline script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src*="paystack"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      console.log("Paystack script loaded successfully");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Paystack script");
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="paystack"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  /**
   * Initialize payment using TanStack Query mutation
   */
  const initializePaymentMutation = useMutation({
    mutationFn: async () => {
      // Determine API endpoint based on payment type
      const isRenewal = !!renewalSlug;
      const endpoint = isRenewal ? "/api/payment/renewal/initialize" : "/api/payment/initialize";

      // Build request body based on payment type
      const body = isRenewal
        ? {
            renewalSlug,
            subscriptionId,
            currency,
          }
        : {
            planSlug: planId,
            currency,
            email: email || "customer@foreverpages.online",
          };

      // Call the payment initialization API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: PaymentInitResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      // Get Paystack public key from environment
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("Paystack public key not configured");
      }

      if (!data.reference) {
        throw new Error("No payment reference received");
      }

      // Convert amount to kobo (Paystack requires amount in smallest currency unit)
      const amountInKobo = Math.round(amount * 100);

      // Store payment ID and email for later use
      if (data.paymentId && typeof window !== "undefined") {
        localStorage.setItem("paymentId", data.paymentId);
        // Store email to pre-fill signup form
        if (email) {
          localStorage.setItem("paymentEmail", email);
        }
      }

      // Return Paystack configuration
      return {
        reference: data.reference,
        email: email || "customer@foreverpages.online",
        amount: amountInKobo,
        publicKey,
      };
    },
    onError: (error) => {
      console.error("Payment initialization error:", error);
      alert(error instanceof Error ? error.message : "Failed to initialize payment");
    },
  });

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = useCallback(
    (reference: { reference: string }) => {
      console.log("Payment successful:", reference);

      // Store payment reference in localStorage for verification
      if (typeof window !== "undefined") {
        localStorage.setItem("paymentReference", reference.reference);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(reference.reference);
      }

      // Redirect to payment-success page for verification
      // The payment-success page will verify payment and redirect to signup with paymentId
      router.push(`/payment-success?reference=${reference.reference}`);
    },
    [onSuccess, router]
  );

  /**
   * Handle button click - initialize payment and open popup
   * Uses TanStack Query mutation with onSuccess to trigger popup
   */
  const handleClick = async () => {
    try {
      // Get the payment configuration
      const config = await initializePaymentMutation.mutateAsync();

      console.log("Payment initialized successfully:", config);

      // Check if Paystack library is loaded
      if (!window.PaystackPop) {
        throw new Error("Paystack library not loaded. Please refresh the page.");
      }

      // Initialize and open Paystack popup
      const handler = window.PaystackPop.setup({
        key: config.publicKey,
        email: config.email,
        amount: config.amount,
        ref: config.reference,
        onClose: () => {
          console.log("Payment popup closed");
          if (onClose) {
            onClose();
          }
        },
        callback: (response: PaystackResponse) => {
          console.log("Payment successful:", response);
          handlePaymentSuccess({ reference: response.reference });
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Payment error:", error);
      alert(`Payment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !scriptLoaded || initializePaymentMutation.isPending}
      className={className}
    >
      {!scriptLoaded ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : initializePaymentMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Initializing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
