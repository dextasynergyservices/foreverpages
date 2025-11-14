"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

type VerificationState = "verifying" | "success" | "error" | "invalid";

export default function ConfirmEmailPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<VerificationState>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);
  const verificationAttemptedRef = React.useRef(false); // Prevent duplicate verification

  useEffect(() => {
    const token = searchParams.get("token");

    // If no token in URL, show error
    if (!token) {
      setState("invalid");
      setErrorMessage("No verification token provided. Please use the link from your email.");
      return;
    }

    // Prevent duplicate verification attempts
    if (verificationAttemptedRef.current) {
      return;
    }

    verificationAttemptedRef.current = true;

    // Verify the token
    verifyToken(token);
  }, [searchParams]);

  // Countdown for redirect after success
  useEffect(() => {
    if (state === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (state === "success" && countdown === 0) {
      router.push("/login");
    }
  }, [state, countdown, router]);

  const verifyToken = async (token: string) => {
    try {
      setState("verifying");

      const response = await fetch(`/api/auth/verify-email-token?token=${token}`, {
        method: "GET",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState("success");
      } else {
        setState("error");
        setErrorMessage(data.error || "Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setState("error");
      setErrorMessage("An error occurred during verification. Please try again.");
    }
  };

  // Optional error handler (for future actual API logic)
  //   const handleError = (error: string) => {
  //     setErrorMessage(error);
  //     setShowErrorToast(true);

  //     // Auto-hide error after 5 seconds
  //     setTimeout(() => {
  //       setShowErrorToast(false);
  //       setErrorMessage("");
  //     }, 5000);
  //   };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mt-20">
            <h1
              className={`text-3xl font-bold mb-2 ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              {t("confirmEmail.title")}
            </h1>
            <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
              {t("confirmEmail.subtitle")}
            </p>
          </div>

          <div
            className={`rounded-2xl shadow-xl border p-8 ${
              theme === "dark" ? "bg-black border-white/30" : "bg-white border-black/30"
            }`}
          >
            {/* Verifying State */}
            {state === "verifying" && (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 mb-4">
                  <svg
                    className="animate-spin h-16 w-16 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <p
                  className={`mt-4 text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
                >
                  {t("confirmEmail.verifying")}
                </p>
              </div>
            )}

            {/* Success State */}
            {state === "success" && (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <p
                  className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  Email Verified!
                </p>
                <p
                  className={`mt-2 text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
                >
                  Redirecting to login in {countdown}s...
                </p>
              </div>
            )}

            {/* Error/Invalid State */}
            {(state === "error" || state === "invalid") && (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <p
                  className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  Verification Failed
                </p>
                <p
                  className={`mt-2 text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
                >
                  {errorMessage}
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
