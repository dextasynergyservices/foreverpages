// app/register/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Heart, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import ReCAPTCHA from "react-google-recaptcha";
import toast from "react-hot-toast";
import { LoadingSpinner, AuthFormSkeleton } from "@/components/ui/skeleton";

export default function RegisterPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput | "recaptcha", string>>>(
    {}
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterInput | "recaptcha", boolean>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Load form data from localStorage on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500); // Simulate loading time

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Save to localStorage
      localStorage.setItem("signupFormData", JSON.stringify(newData));
      return newData;
    });
    if (errors[name as keyof RegisterInput]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (field: keyof RegisterInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Real-time validation on blur
    const fieldResult = registerSchema.shape[field].safeParse(formData[field]);
    if (!fieldResult.success) {
      setErrors((prev) => ({
        ...prev,
        [field]: fieldResult.error.issues[0].message,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getFieldStatus = (field: keyof RegisterInput) => {
    if (!touched[field]) return "";
    if (errors[field]) return "error";
    if (formData[field] && !errors[field]) return "success";
    return "";
  };

  const validateForm = () => {
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof RegisterInput | "recaptcha", string>> = {};
      result.error.issues.forEach((error) => {
        const field = error.path[0] as keyof RegisterInput;
        newErrors[field] = error.message;
      });
      setErrors(newErrors);
      // Show toast for the first validation error
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return false;
    }

    if (!recaptchaToken) {
      setErrors({ recaptcha: "Please complete the reCAPTCHA verification" });
      toast.error("Please complete the reCAPTCHA verification");
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          recaptchaToken,
        }),
      });

      if (response.ok) {
        toast.success("Account created successfully! Please log in.");
        // Clear saved form data on successful registration
        localStorage.removeItem("signupFormData");
        // Registration successful, redirect to login
        window.location.href = "/login";
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Registration failed");
      }
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return <AuthFormSkeleton />;
  }

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
                  onBlur={() => handleBlur("name")}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                  } ${
                    getFieldStatus("name") === "error"
                      ? "border-red-500 bg-red-50"
                      : getFieldStatus("name") === "success"
                        ? "border-green-500 bg-green-50"
                        : theme === "dark"
                          ? "border-white/70 focus:ring-white"
                          : "border-gray-300 focus:ring-black"
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
                  onBlur={() => handleBlur("email")}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                  } ${
                    getFieldStatus("email") === "error"
                      ? "border-red-500 bg-red-50"
                      : getFieldStatus("email") === "success"
                        ? "border-green-500 bg-green-50"
                        : theme === "dark"
                          ? "border-white/70 focus:ring-white"
                          : "border-gray-300 focus:ring-black"
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
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                  } ${
                    errors.password
                      ? "border-red-500 bg-red-50"
                      : theme === "dark"
                        ? "border-white/70 focus:ring-white"
                        : "border-gray-300 focus:ring-black"
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                  } ${
                    errors.confirmPassword
                      ? "border-red-500 bg-red-50"
                      : theme === "dark"
                        ? "border-white/70 focus:ring-white"
                        : "border-gray-300 focus:ring-black"
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

            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                onChange={setRecaptchaToken}
                theme={theme === "dark" ? "dark" : "light"}
              />
            </div>
            {errors.recaptcha && (
              <p className="mt-1 text-sm text-red-500 text-center">{errors.recaptcha}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full ${theme === "dark" ? "bg-white text-black hover:bg-white/80" : "bg-black text-white hover:bg-black/80  "} py-3 rounded-lg font-medium  transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                t("register.buttons.createAccount")
              )}
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
