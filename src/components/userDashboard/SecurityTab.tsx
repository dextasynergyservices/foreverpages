"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { Shield, Smartphone, Mail, Key, Copy, Check, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTranslations } from "@/hooks/useTranslations";

interface TwoFactorStatus {
  enabled: boolean;
  method: "EMAIL" | "AUTHENTICATOR" | null;
  hasBackupCodes: boolean;
  backupCodesCount: number;
}

export default function SecurityTab() {
  const { theme } = useTheme();
  const t = useTranslations();
  const queryClient = useQueryClient();

  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  // Authenticator setup state
  const [showAuthSetup, setShowAuthSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");

  // Get 2FA status
  const { data: twoFactorStatus, isLoading } = useQuery<TwoFactorStatus>({
    queryKey: ["2fa-status"],
    queryFn: async () => {
      const res = await fetch("/api/user/2fa");
      if (!res.ok) throw new Error("Failed to fetch 2FA status");
      return res.json();
    },
  });

  // Enable Email 2FA
  const enableEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", method: "email" }),
      });
      if (!res.ok) throw new Error("Failed to enable email 2FA");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(t.t("twoFactor.settings.success.enabled"));
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: () => {
      toast.error(t.t("twoFactor.settings.error.enableFailed"));
    },
  });

  // Setup Authenticator 2FA - Step 1
  const setupAuthMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", method: "authenticator" }),
      });
      if (!res.ok) throw new Error("Failed to setup authenticator");
      return res.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowAuthSetup(true);
    },
    onError: () => {
      toast.error(t.t("twoFactor.settings.error.enableFailed"));
    },
  });

  // Enable Authenticator 2FA - Step 2
  const enableAuthMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enable",
          method: "authenticator",
          code: verificationCode,
          secret: secret,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(t.t("twoFactor.settings.success.enabled"));
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShowAuthSetup(false);
      setVerificationCode("");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t.t("twoFactor.settings.error.verifyFailed"));
    },
  });

  // Disable 2FA
  const disableMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      if (!res.ok) throw new Error("Failed to disable 2FA");
      return res.json();
    },
    onSuccess: () => {
      toast.success(t.t("twoFactor.settings.success.disabled"));
      setShowBackupCodes(false);
      setBackupCodes([]);
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: () => {
      toast.error(t.t("twoFactor.settings.error.disableFailed"));
    },
  });

  // Regenerate backup codes
  const regenerateCodesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate-backup-codes" }),
      });
      if (!res.ok) throw new Error("Failed to regenerate backup codes");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(t.t("twoFactor.settings.success.codesRegenerated"));
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: () => {
      toast.error(t.t("twoFactor.settings.error.regenerateFailed"));
    },
  });

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAllCodes = () => {
    const allCodes = backupCodes.join("\n");
    navigator.clipboard.writeText(allCodes);
    toast.success(t.t("twoFactor.settings.backupCodes.buttons.copied"));
  };

  const cardBg = theme === "dark" ? "bg-black/40" : "bg-white";
  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  if (isLoading) {
    return <div className="text-center py-8">{t.t("twoFactor.settings.error.loadFailed")}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.t("twoFactor.settings.title")}
          </CardTitle>
          <CardDescription className={textMuted}>
            {t.t("twoFactor.settings.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          {twoFactorStatus?.enabled && (
            <div
              className={`rounded-lg border p-4 ${
                theme === "dark"
                  ? "bg-green-900/20 border-green-700/50"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">{t.t("twoFactor.settings.status.enabled")}</p>
                  <p className={`text-sm ${textMuted}`}>
                    {t.t("twoFactor.settings.status.method.email")}:{" "}
                    {twoFactorStatus.method === "EMAIL"
                      ? t.t("twoFactor.settings.status.method.email")
                      : t.t("twoFactor.settings.status.method.authenticator")}
                  </p>
                  <p className={`text-sm ${textMuted}`}>
                    {t.t("twoFactor.settings.backupCodes.remaining", {
                      count: twoFactorStatus.backupCodesCount,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email 2FA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"}`}
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">
                    {t.t("twoFactor.settings.enable.methods.email.title")}
                  </h4>
                  <p className={`text-sm ${textMuted}`}>
                    {t.t("twoFactor.settings.enable.methods.email.description")}
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactorStatus?.enabled && twoFactorStatus?.method === "EMAIL"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    enableEmailMutation.mutate();
                  } else {
                    if (confirm(t.t("twoFactor.settings.disable.warning.message"))) {
                      disableMutation.mutate();
                    }
                  }
                }}
                disabled={
                  enableEmailMutation.isPending ||
                  disableMutation.isPending ||
                  (twoFactorStatus?.enabled && twoFactorStatus?.method !== "EMAIL")
                }
              />
            </div>
          </div>

          {/* Authenticator App 2FA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"}`}
                >
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">
                    {t.t("twoFactor.settings.enable.methods.authenticator.title")}
                  </h4>
                  <p className={`text-sm ${textMuted}`}>
                    {t.t("twoFactor.settings.enable.methods.authenticator.description")}
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactorStatus?.enabled && twoFactorStatus?.method === "AUTHENTICATOR"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setupAuthMutation.mutate();
                  } else {
                    if (confirm(t.t("twoFactor.settings.disable.warning.message"))) {
                      disableMutation.mutate();
                    }
                  }
                }}
                disabled={
                  setupAuthMutation.isPending ||
                  disableMutation.isPending ||
                  (twoFactorStatus?.enabled && twoFactorStatus?.method !== "AUTHENTICATOR")
                }
              />
            </div>
          </div>

          {/* Authenticator Setup Modal */}
          {showAuthSetup && qrCode && (
            <div
              className={`rounded-lg border p-6 space-y-4 ${theme === "dark" ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"}`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <h4 className="font-medium">{t.t("twoFactor.settings.authenticator.title")}</h4>
              </div>

              <ol className={`space-y-3 text-sm ${textMuted}`}>
                <li>{t.t("twoFactor.settings.authenticator.step1.title")}</li>
                <li>{t.t("twoFactor.settings.authenticator.step2.title")}</li>
              </ol>

              <div className="flex justify-center py-4">
                <Image src={qrCode} alt="QR Code" width={200} height={200} className="rounded-lg" />
              </div>

              <div>
                <Label>{t.t("twoFactor.settings.authenticator.step2.manualEntry")}</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success(t.t("twoFactor.settings.authenticator.step2.copied"));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>{t.t("twoFactor.settings.authenticator.step3.description")}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder={t.t("twoFactor.settings.authenticator.step3.placeholder")}
                    maxLength={6}
                    className="font-mono text-lg text-center"
                  />
                  <Button
                    onClick={() => enableAuthMutation.mutate()}
                    disabled={verificationCode.length !== 6 || enableAuthMutation.isPending}
                  >
                    {enableAuthMutation.isPending
                      ? t.t("twoFactor.settings.authenticator.step3.verifying")
                      : t.t("twoFactor.settings.authenticator.step3.verify")}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAuthSetup(false);
                  setVerificationCode("");
                }}
              >
                {t.t("twoFactor.settings.authenticator.buttons.cancel")}
              </Button>
            </div>
          )}

          {/* Backup Codes */}
          {twoFactorStatus?.enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${theme === "dark" ? "bg-orange-500/20" : "bg-orange-100"}`}
                  >
                    <Key className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{t.t("twoFactor.settings.backupCodes.title")}</h4>
                    <p className={`text-sm ${textMuted}`}>
                      {t.t("twoFactor.settings.backupCodes.remaining", {
                        count: twoFactorStatus.backupCodesCount,
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateCodesMutation.mutate()}
                  disabled={regenerateCodesMutation.isPending}
                >
                  {t.t("twoFactor.settings.backupCodes.buttons.regenerate")}
                </Button>
              </div>

              <div
                className={`rounded-lg border p-4 ${theme === "dark" ? "bg-yellow-900/20 border-yellow-700/50" : "bg-yellow-50 border-yellow-200"}`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className={`text-sm ${textMuted}`}>
                    {t.t("twoFactor.settings.backupCodes.description")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Display Backup Codes */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div
              className={`rounded-lg border p-6 space-y-4 ${theme === "dark" ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t.t("twoFactor.settings.backupCodes.generated")}</h4>
                <Button size="sm" variant="outline" onClick={handleCopyAllCodes}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t.t("twoFactor.settings.backupCodes.buttons.copyAll")}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg font-mono text-sm ${theme === "dark" ? "bg-black/40" : "bg-white"}`}
                  >
                    <span>{code}</span>
                    <button
                      onClick={() => handleCopyCode(code, index)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      {copiedCode === index ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <p className={`text-sm ${textMuted}`}>
                {t.t("twoFactor.settings.backupCodes.warning")}
              </p>

              <Button
                variant="outline"
                onClick={() => setShowBackupCodes(false)}
                className="w-full"
              >
                {t.t("twoFactor.settings.backupCodes.buttons.saved")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription className={textMuted}>
            Update your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button
            variant={theme === "dark" ? "memorial" : "default"}
            className={theme === "dark" ? "bg-white text-black" : ""}
          >
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
