"use client";

import React, { useState } from "react";
import { Heart, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = t("login.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("login.errors.invalidEmail");
    }

    if (!formData.password) {
      newErrors.password = t("login.errors.passwordRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Add your login API call here
      console.log("Login submitted:", formData);
      // Example: await signIn('credentials', formData);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`}
    >
      <Navbar />
      <div className="w-full max-w-md">
        <div className={`text-center mb-8`}>
          <link href="/" className="inline-block">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 shadow-lg hover:bg-gray-800 transition-colors ${theme === "dark" ? "bg-white " : "bg-black"}`}
            >
              <Heart
                className={`w-8 h-8 ${theme === "dark" ? "text-white fill-black" : "text-black fill-white"}`}
              />
            </div>
          </link>
          <h1
            className={`text-3xl font-bold text-black mb-2 ${theme === "dark" ? "text-white " : "text-black"}`}
          >
            {t("login.welcomeBack")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70 " : "text-black/70"}`}>
            {t("login.subtitle")}
          </p>
        </div>

        <div
          className={` rounded-2xl shadow-xl border p-8 ${theme === "dark" ? "bg-black border-white/70" : "bg-white border-black/70"}`}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className={`block md:text-lg text-sm font-medium mb-1 ${theme === "dark" ? "text-white " : "text-black"}`}
              >
                {t("login.form.email")}
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
                />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("login.placeholders.email")}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block md:text-lg text-sm font-medium mb-1  ${theme === "dark" ? "text-white " : "text-black"}`}
              >
                {t("login.form.password")}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("login.placeholders.password")}
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span
                  className={`ml-2 text-gray-600 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
                >
                  {t("login.rememberMe")}
                </span>
              </label>
              <a
                href="/forgot-password"
                className={` font-medium underline ${theme === "dark" ? "text-white/70 text-white hover:text-white/70" : "text-black/70 text-black hover:text-black/70"}`}
              >
                {t("login.forgotPassword")}
              </a>
            </div>

            <button
              onClick={handleSubmit}
              className={`w-full py-3 rounded-lg font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg ${theme === "dark" ? "bg-white text-black hover:bg-white/80 " : "bg-black text-white hover:bg-black/80"}`}
            >
              {t("login.buttons.login")}
            </button>
          </div>

          <div
            className={`mt-6 text-center text-sm text-gray-600 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
          >
            {t("login.noAccount")}{" "}
            <a
              href="/packages"
              className={` font-medium underline ${theme === "dark" ? "text-white hover:text-white/70 " : "text-black hover:text-black/70"}`}
            >
              {t("login.buttons.registerHere")}
            </a>
          </div>
        </div>

        <div
          className={`mt-6 text-center text-sm text-gray-600 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
        >
          <p>{t("login.tagline")}</p>
        </div>
      </div>
    </div>
  );
}
