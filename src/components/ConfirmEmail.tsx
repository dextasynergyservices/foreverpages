"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function ConfirmEmailPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast] = useState(false);
  const [errorMessage] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simulate a realistic verification process (around 15 seconds total)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Show success toast
          setShowSuccessToast(true);

          // Redirect after 3 seconds (shorter and smoother UX)
          setTimeout(() => {
            router.push("/login");
          }, 3000);

          return 100;
        }
        return prev + 1; // slower progress = smoother loading
      });
    }, 150); // 100% / (150ms * 100) ≈ 15s total duration

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

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

      {/* ✅ Success Toast */}
      {showSuccessToast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${
            theme === "dark"
              ? "bg-green-900/90 border-green-700 text-white"
              : "bg-green-100 border-green-300 text-green-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t("confirmEmail.success.toast")}</span>
          </div>
          <div className="text-xs mt-1 opacity-80">{t("confirmEmail.success.redirecting")}</div>
        </div>
      )}

      {/* ⚠️ Error Toast (placeholder for API failures) */}
      {showErrorToast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${
            theme === "dark"
              ? "bg-red-900/90 border-red-700 text-white"
              : "bg-red-100 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
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
            {/* Progress Display */}
            <div className="text-center">
              <div
                className={`text-5xl font-light mb-3 font-mono tracking-tighter ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {Math.round(progress)}%
              </div>

              <div className="w-32 h-0.5 bg-gray-300 rounded-full overflow-hidden mx-auto">
                <div
                  className={`h-full transition-all duration-100 ease-out ${
                    theme === "dark" ? "bg-white" : "bg-black"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className={`mt-4 text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
                {t("confirmEmail.verifying")}
              </p>
            </div>

            <div
              className={`mt-6 text-center text-sm ${
                theme === "dark" ? "text-white/60" : "text-black/60"
              }`}
            >
              <p>{t("confirmEmail.redirectNotice")}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
