// app/reset-password/page.tsx
"use client";

import React, { useState } from "react";
import { Heart, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!formData.password) {
      newErrors.password = t("resetPassword.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("resetPassword.errors.passwordLength");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("resetPassword.errors.passwordsDontMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        console.log("Password reset:", formData);
        setIsSubmitted(true);
        setIsLoading(false);
      }, 1500);
    }
  };

  if (isSubmitted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          theme === "dark" ? "bg-black" : "bg-white"
        }`}
      >
        <Navbar />
        <div className="w-full max-w-md">
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
              {t("resetPassword.success.title")}
            </h1>
            <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
              {t("resetPassword.success.subtitle")}
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
              <Lock
                className={`w-8 h-8 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
              />
            </div>

            <h2
              className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              {t("resetPassword.success.passwordReset")}
            </h2>

            <p className={`mb-6 ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
              {t("resetPassword.success.loginAgain")}
            </p>

            <Link
              href="/login"
              className={`w-full py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg block ${
                theme === "dark"
                  ? "bg-white text-black hover:bg-white/80"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              {t("resetPassword.success.backToLogin")}
            </Link>
          </div>

          <div
            className={`mt-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
          >
            <p>{t("resetPassword.tagline")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`}
    >
      <Navbar />
      <div className="w-full max-w-md">
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
            {t("resetPassword.title")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {t("resetPassword.subtitle")}
          </p>
        </div>

        <div
          className={`rounded-2xl shadow-xl border p-8 ${
            theme === "dark" ? "bg-black border-white/30" : "bg-white border-black/30"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className={`block md:text-lg text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {t("resetPassword.form.newPassword")}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-black text-white border-white/30 focus:ring-white"
                      : "bg-white text-black border-black/30 focus:ring-black"
                  } ${errors.password ? "border-red-500" : ""}`}
                  placeholder={t("resetPassword.placeholders.newPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={`block md:text-lg text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {t("resetPassword.form.confirmPassword")}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    theme === "dark" ? "text-white/70" : "text-black/70"
                  }`}
                />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-black text-white border-white/30 focus:ring-white"
                      : "bg-white text-black border-black/30 focus:ring-black"
                  } ${errors.confirmPassword ? "border-red-500" : ""}`}
                  placeholder={t("resetPassword.placeholders.confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
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
                ? t("resetPassword.buttons.resetting")
                : t("resetPassword.buttons.resetPassword")}
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
              {t("resetPassword.backToLogin")}
            </Link>
          </div>
        </div>

        <div
          className={`mt-6 text-center text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}
        >
          <p>{t("resetPassword.tagline")}</p>
        </div>
      </div>
    </div>
  );
}
