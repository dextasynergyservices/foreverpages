"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Mail, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmailVerificationPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(90);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsResendDisabled(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    // const verificationCode = code.join('');

    // Simulate API verification with error handling
    setTimeout(() => {
      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo

      if (isSuccess) {
        setIsVerifying(false);
        setShowToast(true);

        // Show success toast for 2 seconds then redirect
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setIsVerifying(false);
        setError(t("emailVerification.error.invalid"));
        setShowError(true);

        // Clear the code for retry
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();

        // Hide error after 3 seconds
        setTimeout(() => {
          setShowError(false);
          setError("");
        }, 3000);
      }
    }, 500);
  }, [router, t]);

  useEffect(() => {
    // Auto-submit when all digits are filled
    if (code.every((digit) => digit !== "") && !isVerifying) {
      handleVerify();
    }
  }, [code, isVerifying, handleVerify]);

  const handleResend = async () => {
    if (isResendDisabled) return;

    setIsLoading(true);
    // Clear any existing errors
    setShowError(false);
    setError("");

    // Simulate API call
    setTimeout(() => {
      setTimeLeft(90);
      setIsResendDisabled(true);
      setIsLoading(false);
      console.log("Verification code resent");

      // Clear the current code
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }, 1000);
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const pastedArray = pastedData.split("");

    const newCode = [...code];
    pastedArray.forEach((char, index) => {
      if (index < 6) {
        newCode[index] = char;
      }
    });
    setCode(newCode);

    // Focus the last filled input or the last one
    const lastFilledIndex = Math.min(pastedArray.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Fixed ref callback function
  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`}
    >
      <Navbar />

      {/* Success Toast */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${
            theme === "dark"
              ? "bg-green-900/90 border-green-700 text-white"
              : "bg-green-100 border-green-300 text-green-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t("emailVerification.success.toast")}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${
            theme === "dark"
              ? "bg-red-900/90 border-red-700 text-white"
              : "bg-red-100 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <link href="/" className="inline-block">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg transition-colors ${
                theme === "dark" ? "bg-white hover:bg-white/80" : "bg-black hover:bg-black/80"
              }`}
            >
              <Heart className={`w-8 h-8 ${theme === "dark" ? "text-black" : "text-white"}`} />
            </div>
          </link>
          <h1
            className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("emailVerification.title")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {t("emailVerification.subtitle")}
          </p>
        </div>

        <div
          className={`rounded-2xl shadow-xl border p-8 ${
            theme === "dark" ? "bg-black border-white/30" : "bg-white border-black/30"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"
            }`}
          >
            <Mail className={`w-8 h-8 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
          </div>

          <h2
            className={` flex justify-center text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("emailVerification.enterCode")}
          </h2>

          <p className={`mb-6 text-center ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {t("emailVerification.instructions")}
          </p>

          {/* 6-digit input */}
          <div className="flex justify-center space-x-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={setInputRef(index)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  theme === "dark"
                    ? "bg-black border-white/30 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    : "bg-white border-black/30 text-black focus:border-blue-500 focus:ring-blue-500/20"
                } ${isVerifying ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            ))}
          </div>

          {isVerifying && (
            <div
              className={`text-center mb-4 ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
            >
              {t("emailVerification.verifying")}
            </div>
          )}

          <div className="space-y-4">
            <div
              className={`text-sm text-center ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
            >
              {t("emailVerification.didntReceive")}{" "}
              {isResendDisabled ? (
                <span className="font-medium">
                  {t("emailVerification.resendIn")}{" "}
                  <span className="text-red-500 ml-1">{formatTime(timeLeft)}</span>
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className={`font-medium underline hover:no-underline ${
                    theme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-700"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isLoading
                    ? t("emailVerification.buttons.sending")
                    : t("emailVerification.buttons.resend")}
                </button>
              )}
            </div>

            {/* MAIN RESEND BUTTON */}
            <button
              onClick={handleResend}
              disabled={isResendDisabled || isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-white text-black hover:bg-white/80 disabled:bg-gray-400"
                  : "bg-black text-white hover:bg-black/80 disabled:bg-gray-400"
              }`}
            >
              {isLoading
                ? t("emailVerification.buttons.sending")
                : isResendDisabled
                  ? `${t("emailVerification.resendIn")} ${formatTime(timeLeft)}`
                  : t("emailVerification.buttons.resendCode")}
            </button>

            <Link
              href="/login"
              className={`inline-flex items-center justify-center w-full py-3 rounded-lg font-medium border transition-all ${
                theme === "dark"
                  ? "border-white/30 text-white hover:bg-white/10"
                  : "border-black/30 text-black hover:bg-black/10"
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("emailVerification.buttons.backToLogin")}
            </Link>
          </div>
        </div>

        <div
          className={`mt-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
        >
          <p>{t("emailVerification.tagline")}</p>
        </div>
      </div>
    </div>
  );
}
