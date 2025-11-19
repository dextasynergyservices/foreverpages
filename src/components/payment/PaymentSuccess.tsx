"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Payment Verification Response
 */
interface PaymentVerificationResponse {
  success: boolean;
  data?: {
    paymentId: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    planId: string;
    planName: string;
  };
  message?: string;
}

/**
 * Payment Verification States
 */
type VerificationState = "verifying" | "success" | "failed";

/**
 * PaymentSuccess Component
 *
 * Handles payment verification and success display
 *
 * Flow:
 * 1. Extract payment reference from URL (?reference=xxx)
 * 2. Verify payment via /api/payment/verify
 * 3. Show success animation if verified
 * 4. Store paymentId in localStorage for signup
 * 5. Auto-redirect to signup after 3 seconds
 *
 * Features:
 * - Payment verification via API
 * - Success checkmark animation
 * - Loading state during verification
 * - Error handling for failed verification
 * - Auto-redirect to signup
 * - Manual redirect button
 *
 * @example
 * ```tsx
 * // URL: /payment-success?reference=abcd1234
 * <PaymentSuccess />
 * ```
 */
export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = (searchParams?.get("reference") as string | null) || null;

  const [state, setState] = useState<VerificationState>("verifying");
  const [paymentData, setPaymentData] = useState<PaymentVerificationResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  /**
   * Verify payment on component mount
   */
  useEffect(() => {
    if (!reference) {
      setState("failed");
      setError("No payment reference provided");
      return;
    }

    verifyPayment(reference);
  }, [reference]);

  /**
   * Auto-redirect countdown (only when payment is successful)
   */
  useEffect(() => {
    const redirectAfterPayment = async () => {
      // Check if user is logged in
      try {
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();

        if (session?.user) {
          // User is logged in (e.g., revoked collaborator subscribing)
          // Force a full page reload to refresh dashboard data
          window.location.href = "/user-dashboard";
        } else {
          // User is not logged in (new signup flow)
          // Redirect to auth/signup (the main signup page)
          if (paymentData?.paymentId) {
            router.push(`/auth/signup?payment=${paymentData.paymentId}`);
          } else {
            router.push("/auth/signup");
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // Fallback to signup if there's an error
        router.push("/auth/signup");
      }
    };

    if (state === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (state === "success" && countdown === 0) {
      redirectAfterPayment();
    }
  }, [state, countdown, paymentData, router]);

  /**
   * Verify payment with API
   */
  const verifyPayment = async (paymentReference: string) => {
    try {
      setState("verifying");

      const response = await fetch(`/api/payment/verify?reference=${paymentReference}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: PaymentVerificationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment verification failed");
      }

      // Payment verified successfully
      setPaymentData(data.data || null);
      setState("success");

      // Store payment ID in localStorage for signup
      if (data.data?.paymentId && typeof window !== "undefined") {
        localStorage.setItem("paymentId", data.data.paymentId);
        localStorage.setItem("paymentReference", data.data.reference);
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setState("failed");
      setError(err instanceof Error ? err.message : "Failed to verify payment");
    }
  };

  /**
   * Redirect after successful payment
   */
  const redirectAfterPayment = async () => {
    // Check if user is logged in
    try {
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      if (session?.user) {
        // User is logged in (e.g., revoked collaborator subscribing)
        // Redirect to dashboard
        router.push("/user-dashboard");
      } else {
        // User is not logged in (new signup flow)
        // Redirect to auth/signup (the main signup page)
        if (paymentData?.paymentId) {
          router.push(`/auth/signup?payment=${paymentData.paymentId}`);
        } else {
          router.push("/auth/signup");
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
      // Fallback to signup if there's an error
      router.push("/auth/signup");
    }
  };

  /**
   * Retry payment verification
   */
  const retryVerification = () => {
    if (reference) {
      verifyPayment(reference);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        {/* Verifying State */}
        {state === "verifying" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )}

        {/* Success State */}
        {state === "success" && (
          <div className="text-center">
            {/* Success Animation */}
            <div className="mb-6 flex justify-center">
              <div
                className={cn(
                  "rounded-full bg-green-100 dark:bg-green-900/20 p-4",
                  "animate-in zoom-in duration-500"
                )}
              >
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-foreground">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your payment has been confirmed. Thank you for your purchase!
            </p>

            {/* Payment Details */}
            {paymentData && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-semibold text-foreground">{paymentData.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold text-foreground">
                      {paymentData.currency} {paymentData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-xs text-foreground">
                      {paymentData.reference}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-redirect Message */}
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
            </p>

            {/* Manual Redirect Button */}
            <Button onClick={redirectAfterPayment} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {/* Failed State */}
        {state === "failed" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <XCircle className="h-16 w-16 text-red-600 dark:text-red-500" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-foreground">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't verify your payment. Please try again."}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={retryVerification} className="w-full">
                Retry Verification
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>

            {/* Support Message */}
            <p className="text-sm text-muted-foreground mt-6">
              If you continue to experience issues, please contact support with reference:{" "}
              <span className="font-mono text-xs">{reference || "N/A"}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
