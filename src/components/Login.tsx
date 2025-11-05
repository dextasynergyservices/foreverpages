"use client";

import React, { useState, useEffect } from "react";
import { Heart, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { signIn } from "next-auth/react";
import ReCAPTCHA from "react-google-recaptcha";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import toast from "react-hot-toast";
import { LoadingSpinner, AuthFormSkeleton } from "@/components/ui/skeleton";

interface RateLimitInfo {
  lockoutUntil: number;
  lockoutDuration: string;
}

export default function LoginPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginInput>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput | "recaptcha", string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginInput | "recaptcha", boolean>>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  // Load form data and rate limit info from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("loginFormData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error("Error parsing saved login form data:", error);
      }
    }

    // Check for existing rate limit
    const savedRateLimit = localStorage.getItem("loginRateLimit");
    if (savedRateLimit) {
      try {
        const parsed = JSON.parse(savedRateLimit);
        if (parsed.lockoutUntil && Date.now() < parsed.lockoutUntil) {
          setRateLimitInfo(parsed);
        } else {
          // Expired, clear it
          localStorage.removeItem("loginRateLimit");
        }
      } catch (error) {
        console.error("Error parsing rate limit data:", error);
      }
    }

    // Simulate page loading
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500); // 1.5 second loading simulation

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (!rateLimitInfo) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const timeLeft = rateLimitInfo.lockoutUntil - now;

      if (timeLeft <= 0) {
        // Lockout expired
        setRateLimitInfo(null);
        setCountdown("");
        localStorage.removeItem("loginRateLimit");
        return;
      }

      // Format time remaining
      const seconds = Math.floor(timeLeft / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setCountdown(`${days}d ${hours % 24}h ${minutes % 60}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes % 60}m ${seconds % 60}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds % 60}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Save to localStorage
      localStorage.setItem("loginFormData", JSON.stringify(newData));
      return newData;
    });
    if (errors[name as keyof LoginInput]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (field: keyof LoginInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Real-time validation on blur
    const fieldResult = loginSchema.shape[field].safeParse(formData[field]);
    if (!fieldResult.success) {
      setErrors((prev) => ({
        ...prev,
        [field]: fieldResult.error.issues[0].message,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getFieldStatus = (field: keyof LoginInput) => {
    if (!touched[field]) return "";
    if (errors[field]) return "error";
    if (formData[field] && !errors[field]) return "success";
    return "";
  };

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof LoginInput | "recaptcha", string>> = {};
      result.error.issues.forEach((error) => {
        const field = error.path[0] as keyof LoginInput;
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
      const result = await signIn("credentials", {
        identifier: formData.identifier,
        password: formData.password,
        recaptchaToken,
        redirect: false,
      });

      if (result?.error) {
        // Try to parse error message for rate limit info
        try {
          const errorData = JSON.parse(result.error);

          if (errorData.type === "RATE_LIMIT") {
            const rateLimitData = {
              lockoutUntil: errorData.lockoutUntil,
              lockoutDuration: errorData.lockoutDuration,
            };
            setRateLimitInfo(rateLimitData);
            localStorage.setItem("loginRateLimit", JSON.stringify(rateLimitData));
            toast.error(errorData.message);
          } else if (errorData.type === "INVALID_PASSWORD") {
            if (errorData.remainingAttempts !== undefined) {
              setRemainingAttempts(errorData.remainingAttempts);
              toast.error(
                `Invalid credentials. ${errorData.remainingAttempts} attempt${errorData.remainingAttempts !== 1 ? "s" : ""} remaining before lockout.`
              );
            } else {
              toast.error(errorData.message || "Invalid email/phone or password");
            }
          } else {
            toast.error(errorData.message || "Invalid email/phone or password");
          }
        } catch {
          // Not a JSON error, just show generic message
          toast.error("Invalid email/phone or password");
        }
        setIsLoading(false);
      } else if (result?.ok) {
        toast.success("Login successful! Redirecting...");
        // Clear saved form data and rate limit on successful login
        localStorage.removeItem("loginFormData");
        localStorage.removeItem("loginRateLimit");
        setRateLimitInfo(null);
        setRemainingAttempts(null);

        // Wait a bit for session to be established, then redirect
        setTimeout(() => {
          window.location.href = "/user-dashboard";
        }, 1000);
      } else {
        toast.error("Login failed - please try again");
        setIsLoading(false);
      }
    } catch {
      toast.error("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <>
      {isPageLoading ? (
        <AuthFormSkeleton />
      ) : (
        <div
          className={`min-h-screen flex items-center justify-center p-4 ${
            theme === "dark" ? "bg-black" : "bg-white"
          }`}
        >
          <Navbar />
          <div className="w-full max-w-md">
            <div className={`text-center mb-8`}>
              <Link href="/" className="inline-block">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 shadow-lg hover:bg-gray-800 transition-colors ${theme === "dark" ? "bg-white " : "bg-black"}`}
                >
                  <Heart
                    className={`w-8 h-8 ${theme === "dark" ? "text-white fill-black" : "text-black fill-white"}`}
                  />
                </div>
              </Link>
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
                    htmlFor="identifier"
                    className={`block md:text-lg text-sm font-medium mb-1 ${theme === "dark" ? "text-white " : "text-black"}`}
                  >
                    {t("login.form.emailOrPhone")}
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
                    />
                    <input
                      id="identifier"
                      type="text"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleChange}
                      onBlur={() => handleBlur("identifier")}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                      } ${
                        getFieldStatus("identifier") === "error"
                          ? "border-red-500 bg-red-50"
                          : getFieldStatus("identifier") === "success"
                            ? "border-green-500 bg-green-50"
                            : theme === "dark"
                              ? "border-white/70 focus:ring-white"
                              : "border-gray-300 focus:ring-black"
                      }`}
                      placeholder={t("login.placeholders.emailOrPhone")}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="mt-1 text-sm text-red-500">{errors.identifier}</p>
                  )}
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
                      onBlur={() => handleBlur("password")}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                      } ${
                        getFieldStatus("password") === "error"
                          ? "border-red-500 bg-red-50"
                          : getFieldStatus("password") === "success"
                            ? "border-green-500 bg-green-50"
                            : theme === "dark"
                              ? "border-white/70 focus:ring-white"
                              : "border-gray-300 focus:ring-black"
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div></div>
                  <a
                    href="/forgot-password"
                    className={`font-medium underline ${theme === "dark" ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
                  >
                    {t("login.forgotPassword")}
                  </a>
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

                {/* Rate limit warning */}
                {rateLimitInfo && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">
                      🔒 Too many failed attempts
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 text-center mt-1">
                      Please wait {countdown} before trying again
                    </p>
                  </div>
                )}

                {/* Remaining attempts warning */}
                {!rateLimitInfo && remainingAttempts !== null && remainingAttempts <= 2 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                      ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                      before temporary lockout
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !!rateLimitInfo}
                  className={`w-full py-3 rounded-lg font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${theme === "dark" ? "bg-white text-black hover:bg-white/80" : "bg-black text-white hover:bg-black/80"}`}
                >
                  {rateLimitInfo ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Locked - Wait {countdown}</span>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    t("login.buttons.login")
                  )}
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
      )}
    </>
  );
}
