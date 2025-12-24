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
import TwoFactorVerification from "./TwoFactorVerification";
import { useSearchParams } from "next/navigation";

interface RateLimitInfo {
  lockoutUntil: number;
  lockoutDuration: string;
}

interface TwoFactorData {
  userId: string;
  email: string;
  method: "EMAIL" | "AUTHENTICATOR";
}

export default function LoginPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [formData, setFormData] = useState<LoginInput>({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput | "recaptcha", string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginInput | "recaptcha", boolean>>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      // Preserve any query parameters (like payment ID) in callback
      const paymentId = searchParams?.get("payment");
      const callbackUrl = paymentId ? `/user-dashboard?payment=${paymentId}` : "/user-dashboard";

      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to login with Google");
      setIsGoogleLoading(false);
    }
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
      // First, check if user has 2FA enabled
      const check2FAResponse = await fetch("/api/auth/check-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      if (!check2FAResponse.ok) {
        toast.error("Invalid email/phone or password");
        setIsLoading(false);
        return;
      }

      const check2FAData = await check2FAResponse.json();

      // If 2FA is enabled, show 2FA verification screen
      if (check2FAData.twoFactorEnabled) {
        setTwoFactorData({
          userId: check2FAData.userId,
          email: check2FAData.email,
          method: check2FAData.twoFactorMethod,
        });
        setShow2FA(true);
        setIsLoading(false);
        return;
      }

      // No 2FA, proceed with normal login
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

        // Check for redirect parameter first
        const redirect = searchParams?.get("redirect");
        if (redirect) {
          // Redirect to the originally requested page
          window.location.href = decodeURIComponent(redirect);
          return;
        }

        // Wait a bit for session to be established, then fetch user role and redirect
        setTimeout(async () => {
          try {
            const response = await fetch("/api/auth/session");
            const session = await response.json();

            // Redirect based on user role
            if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/user-dashboard";
            }
          } catch (error) {
            console.error("Error fetching session:", error);
            // Fallback to user dashboard
            window.location.href = "/user-dashboard";
          }
        }, 500); // Reduced timeout for faster redirect
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
      ) : show2FA && twoFactorData ? (
        <TwoFactorVerification
          userId={twoFactorData.userId}
          email={twoFactorData.email}
          method={twoFactorData.method}
          onBack={() => {
            setShow2FA(false);
            setTwoFactorData(null);
            setIsLoading(false);
          }}
        />
      ) : (
        <div
          className={`min-h-screen flex items-center justify-center p-4 ${
            theme === "dark" ? "bg-black" : "bg-white"
          }`}
        >
          <Navbar />
          <div className="w-full max-w-md mt-[90px]">
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
                          ? theme === "dark"
                            ? "border-red-500"
                            : "border-red-500 bg-red-50"
                          : getFieldStatus("identifier") === "success"
                            ? theme === "dark"
                              ? "border-green-500"
                              : "border-green-500 bg-green-50"
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
                          ? theme === "dark"
                            ? "border-red-500"
                            : "border-red-500 bg-red-50"
                          : getFieldStatus("password") === "success"
                            ? theme === "dark"
                              ? "border-green-500"
                              : "border-green-500 bg-green-50"
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
                  <Link
                    href="/forgot-password"
                    className={`font-medium underline ${theme === "dark" ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
                  >
                    {t("login.forgotPassword")}
                  </Link>
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

                {/* OR Divider */}
                <div className="relative">
                  <div className={`absolute inset-0 flex items-center`}>
                    <div
                      className={`w-full border-t ${theme === "dark" ? "border-white/20" : "border-gray-300"}`}
                    ></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span
                      className={`px-2 ${theme === "dark" ? "bg-black text-white/70" : "bg-white text-gray-500"}`}
                    >
                      {t("login.oauth.divider")}
                    </span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || rateLimitInfo !== null}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 border-2 rounded-lg font-medium transition-all ${
                    theme === "dark"
                      ? "border-white/20 hover:border-white/40 hover:bg-white/5"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGoogleLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>{t("login.buttons.signingInWithGoogle")}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>{t("login.buttons.signInWithGoogle")}</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className={`mt-6 text-center text-sm text-gray-600 ${theme === "dark" ? "text-white/70 " : "text-black/70"}`}
              >
                {t("login.noAccount")}{" "}
                <Link
                  href="/packages"
                  className={` font-medium underline ${theme === "dark" ? "text-white hover:text-white/70 " : "text-black hover:text-black/70"}`}
                >
                  {t("login.buttons.registerHere")}
                </Link>
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
