// app/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import { Heart, Mail, ArrowLeft } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError(t("forgotPassword.errors.emailRequired"));
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("forgotPassword.errors.invalidEmail"));
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateEmail()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        console.log("Password reset requested for:", email);
        setIsSubmitted(true);
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  if (isSubmitted) {
    return (
      <div
        className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center p-4`}
      >
        <Navbar />
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
              {t("forgotPassword.success.title")}
            </h1>
            <p className={`text-lg ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
              {t("forgotPassword.success.subtitle")}
            </p>
          </div>

          <div
            className={`rounded-2xl shadow-xl border p-8 text-center ${
              theme === "dark" ? "bg-black border-white/30" : "bg-white border-black/30"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                theme === "dark" ? "bg-green-500/20" : "bg-green-100"
              }`}
            >
              <Mail
                className={`w-8 h-8 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
              />
            </div>

            <h2
              className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              {t("forgotPassword.success.checkEmail")}
            </h2>

            <p className={`mb-6 ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
              {t("forgotPassword.success.instructions", { email })}
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className={`w-full py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${
                  theme === "dark"
                    ? "bg-white text-black hover:bg-white/80"
                    : "bg-black text-white hover:bg-black/80"
                }`}
              >
                {t("forgotPassword.success.tryAgain")}
              </button>

              <Link
                href="/login"
                className={`inline-block w-full py-3 rounded-lg font-medium border transition-all ${
                  theme === "dark"
                    ? "border-white/30 text-white hover:bg-white/10"
                    : "border-black/30 text-black hover:bg-black/10"
                }`}
              >
                {t("forgotPassword.success.backToLogin")}
              </Link>
            </div>
          </div>

          <div
            className={`mt-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
          >
            <p>{t("forgotPassword.tagline")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center p-4`}
    >
      <Navbar />
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
            {t("forgotPassword.title")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {t("forgotPassword.subtitle")}
          </p>
        </div>

        <div
          className={`rounded-2xl shadow-xl border p-8 ${
            theme === "dark" ? "bg-black border-white/30" : "bg-white border-black/30"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {t("forgotPassword.form.email")}
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-black text-white border-white/30 focus:ring-white"
                      : "bg-white text-black border-black/30 focus:ring-black"
                  } ${error ? "border-red-500" : ""}`}
                  placeholder={t("forgotPassword.placeholders.email")}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-white text-black hover:bg-white/80"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              {isLoading
                ? t("forgotPassword.buttons.sending")
                : t("forgotPassword.buttons.resetPassword")}
            </button>
          </form>

          <div
            className={`mt-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
          >
            <Link
              href="/login"
              className={`inline-flex items-center font-medium underline hover:no-underline ${
                theme === "dark"
                  ? "text-white hover:text-white/70"
                  : "text-black hover:text-black/70"
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        </div>

        <div
          className={`mt-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
        >
          <p>{t("forgotPassword.tagline")}</p>
        </div>
      </div>
    </div>
  );
}
