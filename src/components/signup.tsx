// app/register/page.tsx
"use client";

import React, { useState } from "react";
import { Heart, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function RegisterPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = t("register.errors.nameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("register.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("register.errors.invalidEmail");
    }

    if (!formData.password) {
      newErrors.password = t("register.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("register.errors.passwordLength");
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("register.errors.passwordsDontMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Add your registration API call here
      console.log("Registration submitted:", formData);
      // Example: await signUp(formData);
    }
  };

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center p-4`}
    >
      <div
        className={`w-full max-w-md ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
      >
        <Navbar />
        <div className={`text-center mb-8 mt-16`}>
          <Link href="/" className="inline-block">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg hover:bg-gray-800 transition-colors ${theme === "dark" ? "bg-white hover:bg-white/80" : "bg-black hover:bg-black/80"}`}
            >
              <Heart className={`w-8 h-8 ${theme === "dark" ? "text-black" : "text-white"}`} />
            </div>
          </Link>
          <h1
            className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("register.welcome")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {t("register.subtitle")}
          </p>
        </div>

        <div
          className={`rounded-2xl shadow-xl border p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"} mb-1`}
              >
                {t("register.form.name")}
              </label>
              <div className="relative">
                <User
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white" : "text-black"}`}
                />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("register.placeholders.name")}
                />
              </div>
              {errors.name && (
                <p className={`mt-1 text-sm ${theme === "dark" ? "text-red-500" : "text-red-500"}`}>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"} mb-1`}
              >
                {t("register.form.email")}
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white" : "text-black"}`}
                />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg  ${theme === "dark" ? "bg-black text-white border-white/30 focus:outline-none focus:ring-2 focus:ring-black" : "bg-white text-black border-black/30 focus:outline-none focus:ring-2 focus:ring-black"} ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("register.placeholders.email")}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"} mb-1`}
              >
                {t("register.form.password")}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white" : "text-black"}`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg  ${theme === "dark" ? "bg-black text-white border-white/30 focus:outline-none focus:ring-2 focus:ring-black" : "bg-white text-black border-black/30 focus:outline-none focus:ring-2 focus:ring-black"} ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("register.placeholders.password")}
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
                className={`block text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"} mb-1`}
              >
                {t("register.form.confirmPassword")}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white" : "text-black"}`}
                />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${theme === "dark" ? "bg-black text-white border-white/30" : "bg-white text-black border-black/30"} ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("register.placeholders.confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className={`mt-1 text-sm ${theme === "dark" ? "text-red-500" : "text-red-500"}`}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className={`w-full ${theme === "dark" ? "bg-white text-black hover:bg-white/80" : "bg-black text-white hover:bg-black/80  "} py-3 rounded-lg font-medium  transition-all shadow-md hover:shadow-lg`}
            >
              {t("register.buttons.createAccount")}
            </button>
          </div>

          <div
            className={`mt-6 text-center text-sm text-gray-600 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("register.alreadyHaveAccount")}{" "}
            <a
              href="/login"
              className={`${theme === "dark" ? "text-white" : "text-black"} hover:text-gray-700 font-medium underline`}
            >
              {t("register.buttons.loginHere")}
            </a>
          </div>

          <p
            className={`mt-4 text-xs text-gray-500 text-center ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("register.terms.byRegistering")}{" "}
            <a
              href="/terms"
              className={`underline hover:text-gray-700 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              {t("register.terms.termsOfService")}
            </a>{" "}
            {t("register.terms.and")}{" "}
            <a href="/privacy" className="underline hover:text-gray-700">
              {t("register.terms.privacyPolicy")}
            </a>
          </p>
        </div>

        <div
          className={`mt-6 text-center text-sm text-gray-500 ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          <p>{t("register.tagline")}</p>
        </div>
      </div>
    </div>
  );
}
