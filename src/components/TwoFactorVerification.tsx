"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, ArrowLeft, Shield } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "@/hooks/useTranslations";

interface TwoFactorVerificationProps {
  userId: string;
  email: string;
  method: "EMAIL" | "AUTHENTICATOR";
  onBack: () => void;
}

export default function TwoFactorVerification({
  userId,
  email,
  method,
  onBack,
}: TwoFactorVerificationProps) {
  const { theme } = useTheme();
  const t = useTranslations();
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send email code if method is EMAIL (only once)
  useEffect(() => {
    if (method === "EMAIL") {
      sendEmailCode(false); // false = initial send, not a resend
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  const sendEmailCode = async (isResend = true) => {
    try {
      const res = await fetch("/api/user/2fa/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      if (!res.ok) throw new Error("Failed to send code");

      // Show different message for initial send vs resend
      if (isResend) {
        toast.success(t.t("twoFactor.verification.resendCode"));
      } else {
        toast.success(t.t("twoFactor.verification.codeSent"));
      }
    } catch {
      toast.error(t.t("twoFactor.verification.error.failed"));
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsVerifying(true);

    try {
      const res = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: verificationCode,
          isBackupCode: useBackupCode,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const data = await res.json();

      // Success! Complete the sign in using the session token
      toast.success(t.t("twoFactor.verification.success"));

      // Sign in the user with the temporary 2FA session token
      const result = await signIn("credentials", {
        identifier: email,
        password: "", // Not needed with 2FA token
        recaptchaToken: "", // Not needed with 2FA token
        twoFactorToken: data.sessionToken,
        redirect: false,
      });

      if (result?.ok) {
        // Check user role and redirect
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/user-dashboard");
        }
      } else {
        throw new Error(result?.error || t.t("twoFactor.verification.error.failed"));
      }

      // Show backup codes warning if low
      if (data.remainingBackupCodes !== undefined && data.remainingBackupCodes <= 2) {
        toast.error(
          t.t("twoFactor.settings.backupCodes.warning", { count: data.remainingBackupCodes })
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.t("twoFactor.verification.error.invalidCode")
      );
      setIsVerifying(false);

      // Clear code for retry
      if (useBackupCode) {
        setBackupCode("");
      } else {
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }
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
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newCode[i] = pastedData[i];
      }
    }

    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  useEffect(() => {
    if (code.every((digit) => digit !== "") && !isVerifying) {
      handleVerify(code.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isVerifying]);

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

      <div className="w-full max-w-md mt-20">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg transition-colors ${
                theme === "dark" ? "bg-white hover:bg-white/80" : "bg-black hover:bg-black/80"
              }`}
            >
              <Heart className={`w-8 h-8 ${theme === "dark" ? "text-black" : "text-white"}`} />
            </div>
          </Link>
          <h1
            className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t.t("twoFactor.verification.title")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {method === "EMAIL"
              ? t.t("twoFactor.verification.subtitle.email")
              : t.t("twoFactor.verification.subtitle.authenticator")}
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
            <Shield className={`w-8 h-8 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
          </div>

          {!useBackupCode ? (
            <>
              <h2
                className={`flex justify-center text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {t.t("twoFactor.verification.enterCode")}
              </h2>

              <p
                className={`mb-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
              >
                {method === "EMAIL"
                  ? t.t("twoFactor.verification.instructions.email", { email })
                  : t.t("twoFactor.verification.instructions.authenticator")}
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
                  className={`text-center mb-4 text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
                >
                  {t.t("twoFactor.verification.verifying")}
                </div>
              )}

              {method === "EMAIL" && (
                <button
                  onClick={() => sendEmailCode(true)}
                  className={`w-full text-center text-sm mb-4 ${
                    theme === "dark"
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {t.t("twoFactor.verification.resendCode")}
                </button>
              )}

              <button
                onClick={() => setUseBackupCode(true)}
                className={`w-full text-center text-sm ${
                  theme === "dark"
                    ? "text-white/70 hover:text-white"
                    : "text-black/70 hover:text-black"
                }`}
              >
                {t.t("twoFactor.verification.useBackupCode")}
              </button>
            </>
          ) : (
            <>
              <h2
                className={`flex justify-center text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {t.t("twoFactor.verification.backupCode.title")}
              </h2>

              <p
                className={`mb-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
              >
                {t.t("twoFactor.verification.backupCode.subtitle")}
              </p>

              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder={t.t("twoFactor.verification.backupCode.placeholder")}
                maxLength={9}
                className={`w-full h-12 text-center text-lg font-mono border-2 rounded-lg focus:outline-none focus:ring-2 transition-all mb-4 ${
                  theme === "dark"
                    ? "bg-black border-white/30 text-white focus:border-blue-400 focus:ring-blue-400/20"
                    : "bg-white border-black/30 text-black focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />

              <button
                onClick={() => handleVerify(backupCode)}
                disabled={backupCode.length < 8 || isVerifying}
                className={`w-full py-3 rounded-lg font-medium transition-all mb-4 ${
                  theme === "dark"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-black/90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isVerifying
                  ? t.t("twoFactor.verification.verifying")
                  : t.t("twoFactor.verification.backupCode.verify")}
              </button>

              <button
                onClick={() => {
                  setUseBackupCode(false);
                  setBackupCode("");
                }}
                className={`w-full text-center text-sm ${
                  theme === "dark"
                    ? "text-white/70 hover:text-white"
                    : "text-black/70 hover:text-black"
                }`}
              >
                {t.t("twoFactor.verification.backupCode.useVerificationCode")}
              </button>
            </>
          )}

          <div className="mt-6">
            <button
              onClick={onBack}
              className={`inline-flex items-center justify-center text-sm ${
                theme === "dark"
                  ? "text-white/70 hover:text-white"
                  : "text-black/70 hover:text-black"
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.t("twoFactor.verification.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
