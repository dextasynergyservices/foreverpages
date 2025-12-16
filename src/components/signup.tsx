// app/register/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Heart, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import ReCAPTCHA from "react-google-recaptcha";
import toast from "react-hot-toast";
import { LoadingSpinner, AuthFormSkeleton } from "@/components/ui/skeleton";
import { signIn } from "next-auth/react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function RegisterPage() {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterInput>({
    name: "",
    email: "",
    phone: "",
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [collaboratorInfo, setCollaboratorInfo] = useState<{
    memorial: string;
    invitation: string;
  } | null>(null);
  const [phoneValue, setPhoneValue] = useState<string>("");

  // Load payment ID and verify payment OR check for collaborator signup
  useEffect(() => {
    async function verifyPayment() {
      // Check if this is a collaborator signup (no payment required)
      const type = searchParams?.get("type");
      const memorial = searchParams?.get("memorial");
      const invitation = searchParams?.get("invitation");
      const prefillEmail = searchParams?.get("email");

      if (type === "collaborator" && memorial && invitation) {
        // Collaborator signup - no payment required
        setIsCollaborator(true);
        setCollaboratorInfo({ memorial, invitation });
        setPaymentVerified(true); // Skip payment verification
        if (prefillEmail) {
          setFormData((prev) => ({ ...prev, email: prefillEmail }));
        }
        setIsPageLoading(false);
        return;
      }

      // Regular signup - require payment
      const urlPaymentId = searchParams?.get("payment");
      const storedPaymentId = localStorage.getItem("paymentId");
      const storedReference = localStorage.getItem("paymentReference");

      const finalPaymentId = urlPaymentId || storedPaymentId;

      if (!finalPaymentId) {
        toast.error(t("register.errors.paymentRequired"));
        setTimeout(() => {
          window.location.href = "/packages";
        }, 2000);
        return;
      }

      // Verify payment status with backend
      if (storedReference) {
        try {
          const response = await fetch(`/api/payment/verify?reference=${storedReference}`);
          const data = await response.json();

          if (response.ok && data.success && data.data.status === "SUCCESS") {
            setPaymentId(finalPaymentId);
            setPaymentVerified(true);

            // Pre-fill email from payment data if available
            const paymentEmail = localStorage.getItem("paymentEmail");
            if (paymentEmail) {
              setFormData((prev) => ({ ...prev, email: paymentEmail }));
            }

            setIsPageLoading(false);
          } else {
            toast.error(t("register.errors.paymentVerificationFailed"));
            setTimeout(() => {
              window.location.href = "/packages";
            }, 2000);
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error(t("register.errors.paymentVerificationError"));
          setTimeout(() => {
            window.location.href = "/packages";
          }, 2000);
        }
      } else {
        // No reference stored, assume payment is valid (backward compatibility)
        setPaymentId(finalPaymentId);
        setPaymentVerified(true);
        setIsPageLoading(false);
      }
    }

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const handlePhoneChange = (value: string | undefined) => {
    const phoneNumber = value || "";
    setPhoneValue(phoneNumber);
    setFormData((prev) => {
      const newData = { ...prev, phone: phoneNumber };
      localStorage.setItem("signupFormData", JSON.stringify(newData));
      return newData;
    });

    // Validate phone number in real-time
    if (phoneNumber) {
      if (!isValidPhoneNumber(phoneNumber)) {
        setErrors((prev) => ({ ...prev, phone: "Please enter a valid phone number" }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    } else {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleBlur = (field: keyof RegisterInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // For phone field, use custom validation
    if (field === "phone") {
      if (formData.phone && !isValidPhoneNumber(formData.phone)) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Please enter a valid phone number",
        }));
      } else {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
      return;
    }

    // Real-time validation for other fields
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

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      // Preserve payment ID in URL if it exists
      const callbackUrl = paymentId ? `/user-dashboard?payment=${paymentId}` : "/user-dashboard";

      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Google sign-up error:", error);
      toast.error("Failed to sign up with Google");
      setIsGoogleLoading(false);
    }
  };

  const validateForm = () => {
    // Custom validation for phone
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setErrors((prev) => ({ ...prev, phone: "Please enter a valid phone number" }));
      toast.error("Please enter a valid phone number");
      return false;
    }

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
      setErrors({ recaptcha: t("register.errors.recaptchaRequired") });
      toast.error(t("register.errors.recaptchaRequired"));
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // For collaborators, skip payment verification
    if (!isCollaborator && (!paymentId || !paymentVerified)) {
      toast.error(t("register.errors.paymentRequired"));
      return;
    }

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
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          paymentId: isCollaborator ? null : paymentId, // No payment for collaborators
          recaptchaToken,
          isCollaborator,
          invitationToken: isCollaborator ? collaboratorInfo?.invitation : null,
        }),
      });

      if (response.ok) {
        toast.success(t("register.success.accountCreated"));
        // Clear saved form data and payment ID on successful registration
        localStorage.removeItem("signupFormData");
        localStorage.removeItem("paymentId");
        localStorage.removeItem("paymentReference");

        // Redirect based on account type
        if (isCollaborator && collaboratorInfo) {
          // Collaborator: redirect to memorial or dashboard
          window.location.href = `/user-dashboard?message=collaborator_account_created&memorial=${collaboratorInfo.memorial}`;
        } else {
          // Regular user: redirect to email verification
          window.location.href = "/email-verification-code";
        }
      } else {
        const errorData = await response.json();
        console.error("Registration error:", errorData);

        // Show detailed validation errors if available
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: { message: string; path: string[] }) => {
            toast.error(`${err.path.join(".")}: ${err.message}`);
          });
        } else {
          toast.error(
            errorData.error || errorData.message || t("register.errors.registrationFailed")
          );
        }
      }
    } catch (error) {
      console.error("Registration exception:", error);
      toast.error(t("register.errors.registrationError"));
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
            {isCollaborator ? "Create Your Free Account" : t("register.welcome")}
          </h1>
          <p className={`${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
            {isCollaborator
              ? "You've been invited to help manage a memorial. Create a free account to get started."
              : t("register.subtitle")}
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
                htmlFor="phone"
                className={`block text-sm font-medium ${theme === "dark" ? "text-white" : "text-black"} mb-1`}
              >
                {t("register.form.phone")}
              </label>
              <div className="relative">
                <Phone
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-white" : "text-black"} z-10`}
                />
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur("phone")}
                  className={`
                    react-phone-input-wrapper
                    w-full pl-10 pr-4 py-1 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                    ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}
                    ${
                      errors.phone
                        ? "border-red-500 bg-red-50"
                        : theme === "dark"
                          ? "border-white/70 focus:ring-white"
                          : "border-gray-300 focus:ring-black"
                    }
                  `}
                  numberInputProps={{
                    className: `w-full py-3 focus:outline-none ${
                      theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                    }`,
                  }}
                  countrySelectProps={{
                    className: `py-2 ${
                      theme === "dark" ? "bg-black text-white" : "bg-white text-black"
                    }`,
                  }}
                  style={
                    {
                      "--PhoneInputCountryFlag-height": "20px",
                      "--PhoneInputCountryFlag-width": "30px",
                      "--PhoneInputCountrySelectArrow-width": "8px",
                      "--PhoneInputCountrySelectArrow-height": "8px",
                    } as React.CSSProperties
                  }
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              <p className={`mt-1 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                Include country code (e.g., +1 for US)
              </p>
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
                  <span>{t("register.buttons.creatingAccount")}</span>
                </div>
              ) : (
                t("register.buttons.createAccount")
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
                  {t("register.oauth.divider")}
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || !paymentVerified}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 border-2 rounded-lg font-medium transition-all ${
                theme === "dark"
                  ? "border-white/20 hover:border-white/40 hover:bg-white/5"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isGoogleLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>{t("register.buttons.signingUpWithGoogle")}</span>
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
                  <span>{t("register.buttons.continueWithGoogle")}</span>
                </>
              )}
            </button>
          </div>

          <div
            className={`mt-6 text-center text-sm text-gray-600 ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("register.alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className={`${theme === "dark" ? "text-white" : "text-black"} hover:text-gray-700 font-medium underline`}
            >
              {t("register.buttons.loginHere")}
            </Link>
          </div>

          <p
            className={`mt-4 text-xs text-gray-500 text-center ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            {t("register.terms.byRegistering")}{" "}
            <Link
              href="/terms"
              className={`underline hover:text-gray-700 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              {t("register.terms.termsOfService")}
            </Link>{" "}
            {t("register.terms.and")}{" "}
            <Link href="/privacy" className="underline hover:text-gray-700">
              {t("register.terms.privacyPolicy")}
            </Link>
          </p>
        </div>

        <div
          className={`mt-6 text-center text-sm text-gray-500 ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          <p>{t("register.tagline")}</p>
        </div>

        {/* Add this style tag at the bottom of your component */}
        <style jsx global>{`
          .PhoneInputCountryIcon {
            --PhoneInputCountryFlag-height: 10px !important;
            --PhoneInputCountryFlag-width: 10px !important;
          }
          .PhoneInputCountrySelectArrow {
            width: 3px !important;
            height: 5px !important;
            border-width: 0 2px 2px 0 !important;
          }
          .PhoneInputCountry {
            padding: 0 8px !important;
            align-items: center !important;
          }
        `}</style>
      </div>
    </div>
  );
}
