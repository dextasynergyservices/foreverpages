"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Send, Loader2, Mail, Phone, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Contact: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Form submitted:", formData);
    setIsSubmitting(false);
    // Reset form or show success message
  };

  return (
    <section
      id="contact"
      className={cn(
        "w-full py-16 px-6 transition-colors duration-300",
        theme === "dark" ? "bg-black" : "bg-white"
      )}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className={cn(
              "text-3xl md:text-4xl font-serif font-bold mb-4 transition-colors duration-300",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {t("contact.title")}
          </h2>
          <p
            className={cn(
              "text-lg md:text-xl max-w-2xl mx-auto transition-colors duration-300",
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            )}
          >
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Email */}
            <div
              className={cn(
                "p-6 rounded-lg border transition-colors duration-300",
                theme === "dark" ? "border-white/30 bg-black/50" : "border-gray-300 bg-gray-50"
              )}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors duration-300",
                    theme === "dark" ? "bg-white/10" : "bg-gray-200"
                  )}
                >
                  <Mail
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold mb-2 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {t("contact.info.email.title")}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mb-3 transition-colors duration-300",
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    )}
                  >
                    {t("contact.info.email.description")}
                  </p>
                  <a
                    href="mailto:info@foreverpages.online"
                    className={cn(
                      "font-medium transition-colors duration-300 hover:underline",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    info@foreverpages.online
                  </a>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div
              className={cn(
                "p-6 rounded-lg border transition-colors duration-300",
                theme === "dark" ? "border-white/30 bg-black/50" : "border-gray-300 bg-gray-50"
              )}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors duration-300",
                    theme === "dark" ? "bg-white/10" : "bg-gray-200"
                  )}
                >
                  <Phone
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold mb-2 transition-colors duration-300 pt-12",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {t("contact.info.phone.title")}
                  </h3>
                  <p
                    className={cn(
                      "text-sm mb-3 transition-colors duration-300",
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    )}
                  >
                    {t("contact.info.phone.description")}
                  </p>
                  <div className="space-y-2">
                    <a
                      href="tel:+2348103208297"
                      className={cn(
                        "block font-medium transition-colors duration-300 hover:underline",
                        theme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      +234 810 320 8297
                    </a>
                    <a
                      href="https://wa.me/2348103208297"
                      className={cn(
                        "block font-medium transition-colors duration-300 hover:underline",
                        theme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      WhatsApp: +234 810 320 8297
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div
              className={cn(
                "p-6 rounded-lg border transition-colors duration-300",
                theme === "dark" ? "border-white/30 bg-black/50" : "border-gray-300 bg-gray-50"
              )}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors duration-300",
                    theme === "dark" ? "bg-white/10" : "bg-gray-200"
                  )}
                >
                  <MapPin
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold mb-2 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {t("contact.info.address.title")}
                  </h3>
                  <p
                    className={cn(
                      "text-sm transition-colors duration-300",
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    )}
                  >
                    147 NTA Road, Mgbuoba
                    <br />
                    Port Harcourt, Rivers State, Nigeria.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div
              className={cn(
                "p-6 rounded-lg border transition-colors duration-300",
                theme === "dark" ? "border-white/30 bg-black/50" : "border-gray-300 bg-gray-50"
              )}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors duration-300",
                    theme === "dark" ? "bg-white/10" : "bg-gray-200"
                  )}
                >
                  <Clock
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "text-lg font-semibold mb-2 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {t("contact.info.hours.title")}
                  </h3>
                  <div
                    className={cn(
                      "text-sm space-y-1 transition-colors duration-300",
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    )}
                  >
                    <p>
                      <strong>{t("contact.info.hours.weekdays")}</strong>
                    </p>
                    <p>10:00 AM - 6:00 PM (WAT)</p>
                    <p className="mt-2">
                      <strong>{t("contact.info.hours.saturday")}</strong>
                    </p>
                    <p>{t("contact.info.hours.closed")}</p>
                    <p className="mt-2">
                      <strong>{t("contact.info.hours.sunday")}</strong>
                    </p>
                    <p>{t("contact.info.hours.closed")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className={cn(
                "p-8 rounded-lg border transition-colors duration-300",
                theme === "dark" ? "border-white/30 bg-black/50" : "border-gray-300 bg-gray-50"
              )}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className={cn(
                        "block text-sm font-medium mb-2 transition-colors duration-300",
                        theme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      {t("contact.form.name")}
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={cn(
                        "transition-colors duration-300",
                        theme === "dark"
                          ? "bg-black border-white/30 text-white placeholder:text-gray-400 focus:border-white"
                          : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                      )}
                      placeholder={t("contact.form.namePlaceholder")}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className={cn(
                        "block text-sm font-medium mb-2 transition-colors duration-300",
                        theme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      {t("contact.form.email")}
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={cn(
                        "transition-colors duration-300",
                        theme === "dark"
                          ? "bg-black border-white/30 text-white placeholder:text-gray-400 focus:border-white"
                          : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                      )}
                      placeholder={t("contact.form.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className={cn(
                      "block text-sm font-medium mb-2 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {t("contact.form.subject")}
                  </label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={cn(
                      "transition-colors duration-300",
                      theme === "dark"
                        ? "bg-black border-white/30 text-white placeholder:text-gray-400 focus:border-white"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                    )}
                    placeholder={t("contact.form.subjectPlaceholder")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className={cn(
                      "block text-sm font-medium mb-2 transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {t("contact.form.message")}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={cn(
                      "transition-colors duration-300 resize-none",
                      theme === "dark"
                        ? "bg-black border-white/30 text-white placeholder:text-gray-400 focus:border-white"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                    )}
                    placeholder={t("contact.form.messagePlaceholder")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full md:w-auto px-8 py-3 font-semibold transition-all duration-300 border backdrop-blur-sm",
                    theme === "dark"
                      ? "bg-white/80 hover:bg-white text-black border-white/50"
                      : "bg-black hover:bg-black/80 text-white border-black"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("contact.form.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("contact.form.send")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
