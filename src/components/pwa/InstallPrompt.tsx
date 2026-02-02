"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, PlusSquare, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

interface InstallPromptProps {
  className?: string;
  variant?: "banner" | "dialog" | "minimal";
}

export function InstallPrompt({ className, variant = "banner" }: InstallPromptProps) {
  const { t } = useTranslations();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    promptInstall,
    dismissPrompt,
    shouldShowPrompt,
  } = useInstallPrompt();

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show prompt with delay to not interrupt user immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((isInstallable || isIOS) && !isInstalled && !isStandalone && shouldShowPrompt()) {
        setIsVisible(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, [isInstallable, isIOS, isInstalled, isStandalone, shouldShowPrompt]);

  // Handle install click
  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const installed = await promptInstall();
      if (installed) {
        setIsVisible(false);
      }
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    dismissPrompt();
  };

  // Don't render if not visible
  if (!isVisible) return null;

  // Minimal variant - just a button
  if (variant === "minimal") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        className={cn("gap-2", className)}
      >
        <Download className="h-4 w-4" />
        {t("pwa.install.button")}
      </Button>
    );
  }

  // Dialog variant
  if (variant === "dialog") {
    return (
      <>
        <Dialog open={isVisible} onOpenChange={(open) => !open && handleDismiss()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t("pwa.install.title")}
              </DialogTitle>
              <DialogDescription>{t("pwa.install.description")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">{t("pwa.install.benefits.title")}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ {t("pwa.install.benefits.offline")}</li>
                  <li>✓ {t("pwa.install.benefits.faster")}</li>
                  <li>✓ {t("pwa.install.benefits.notifications")}</li>
                  <li>✓ {t("pwa.install.benefits.homeScreen")}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDismiss} className="flex-1">
                  {t("pwa.install.dismiss")}
                </Button>
                <Button onClick={handleInstall} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {t("pwa.install.button")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* iOS Instructions Dialog */}
        <IOSInstructionsDialog
          open={showIOSInstructions}
          onClose={() => {
            setShowIOSInstructions(false);
            setIsVisible(false);
          }}
        />
      </>
    );
  }

  // Default: Banner variant
  return (
    <>
      <Card
        className={cn(
          "fixed bottom-4 left-4 right-4 z-50 shadow-lg md:left-auto md:right-4 md:w-[400px]",
          "animate-in slide-in-from-bottom-5 duration-300",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{t("pwa.install.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("pwa.install.description")}</p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={handleInstall}>
                  <Download className="h-3 w-3 mr-1.5" />
                  {t("pwa.install.button")}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  {t("pwa.install.dismiss")}
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* iOS Instructions Dialog */}
      <IOSInstructionsDialog
        open={showIOSInstructions}
        onClose={() => {
          setShowIOSInstructions(false);
          setIsVisible(false);
        }}
      />
    </>
  );
}

// iOS-specific installation instructions
function IOSInstructionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslations();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t("pwa.install.ios.title")}
          </DialogTitle>
          <DialogDescription>{t("pwa.install.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-sm">{t("pwa.install.ios.step1")}</p>
                <p className="text-xs text-muted-foreground">{t("pwa.install.ios.shareIcon")}</p>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <Share className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-sm">{t("pwa.install.ios.step2")}</p>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <PlusSquare className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-sm">{t("pwa.install.ios.step3")}</p>
              </div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            {t("pwa.install.installed")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Android-specific instructions (if needed)
export function AndroidInstructions() {
  const { t } = useTranslations();

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          1
        </div>
        <div>
          <p className="font-medium text-sm">{t("pwa.install.android.step1")}</p>
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          2
        </div>
        <div>
          <p className="font-medium text-sm">{t("pwa.install.android.step2")}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          3
        </div>
        <div>
          <p className="font-medium text-sm">{t("pwa.install.android.step3")}</p>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
