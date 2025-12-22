"use client";

import React from "react";
import { Clock, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface ExpiredMemorialPageProps {
  memorialName: string;
  ownerEmail?: string;
}

/**
 * Full page displayed to public viewers when memorial is expired
 */
export const ExpiredMemorialPage: React.FC<ExpiredMemorialPageProps> = ({
  memorialName,
  ownerEmail,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();

  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-gray-50";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-4`}>
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">
            {t("memorial.expired.title", {}, "Memorial Temporarily Unavailable")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className={textMuted}>
              {t(
                "memorial.expired.message",
                { name: memorialName },
                "The memorial page for {{name}} is currently unavailable because the subscription has expired."
              )}
            </p>
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-left">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t(
                  "memorial.expired.info",
                  {},
                  "This is a temporary status. Once the page owner renews their subscription, this memorial will be accessible again."
                )}
              </p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-center">
              {t("memorial.expired.contactTitle", {}, "Contact Page Owner")}
            </h3>
            <p className={`text-sm text-center ${textMuted}`}>
              {t(
                "memorial.expired.contactMessage",
                {},
                "If you need to access this memorial urgently, please reach out to the page owner to request renewal."
              )}
            </p>
            {ownerEmail && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(
                      `Access Request for ${memorialName} Memorial`
                    )}`;
                  }}
                >
                  <Mail className="h-4 w-4" />
                  {t("memorial.expired.contactOwner", {}, "Contact Owner")}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-6 border-t">
            <div className="text-center space-y-2">
              <p className={`text-sm ${textMuted}`}>
                {t(
                  "memorial.expired.createOwn",
                  {},
                  "Want to create a memorial for your loved one?"
                )}
              </p>
              <Button
                variant="default"
                onClick={() => {
                  window.location.href = "/packages";
                }}
              >
                {t("memorial.expired.viewPackages", {}, "View Our Packages")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
