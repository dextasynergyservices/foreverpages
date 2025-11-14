"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Mail, X, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "@/hooks/useTranslations";

interface User {
  email: string;
  emailVerified: Date | null;
}

export default function EmailVerificationBanner() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslations();

  const [user, setUser] = useState<User | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);

  // Fetch user session
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/user", {
          cache: "no-store", // Don't cache the session check
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }

    fetchUser();

    // Refetch when window gains focus (user returns from verification)
    const handleFocus = () => {
      fetchUser();
    };

    window.addEventListener("focus", handleFocus);

    // Also refetch periodically (every 30 seconds) in case user verifies in another tab
    const interval = setInterval(fetchUser, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Don't show banner if user is verified or dismissed
  if (!user || user.emailVerified || !isVisible) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Verification email sent! Check your inbox.");
      } else {
        toast.error(data.error || "Failed to resend verification email.");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyNow = () => {
    router.push("/email-verification-code");
  };

  return (
    <div
      className={`relative border-l-4 p-4 mb-6 rounded-lg shadow-md ${
        theme === "dark"
          ? "bg-yellow-900/20 border-yellow-500 text-yellow-100"
          : "bg-yellow-50 border-yellow-500 text-yellow-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle
            className={`w-5 h-5 ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3
                className={`font-semibold mb-1 ${
                  theme === "dark" ? "text-yellow-100" : "text-yellow-900"
                }`}
              >
                <Mail className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                {t("emailVerification.banner.title")}
              </h3>
              <p
                className={`text-sm mb-3 ${
                  theme === "dark" ? "text-yellow-200/90" : "text-yellow-800"
                }`}
              >
                {t("emailVerification.banner.description")}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleVerifyNow}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {t("emailVerification.banner.verifyNow")}
                </button>

                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    theme === "dark"
                      ? "border-yellow-500/50 hover:bg-yellow-900/30 text-yellow-200"
                      : "border-yellow-600 hover:bg-yellow-100 text-yellow-700"
                  } ${isResending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Mail className="w-4 h-4 mr-1.5" />
                  {isResending
                    ? t("emailVerification.banner.sending")
                    : t("emailVerification.banner.resendEmail")}
                </button>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setIsVisible(false)}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-yellow-800/30 text-yellow-300"
                  : "hover:bg-yellow-200 text-yellow-700"
              }`}
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
