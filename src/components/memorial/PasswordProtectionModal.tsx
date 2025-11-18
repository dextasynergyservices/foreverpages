"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PasswordProtectionModalProps {
  streamId: string;
  onSuccess: () => void;
}

export default function PasswordProtectionModal({
  streamId,
  onSuccess,
}: PasswordProtectionModalProps) {
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/streams/${streamId}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (response.ok) {
        setIsOpen(false);
        const data = await response.json().catch(() => null);
        // If server returned an accessToken, persist it locally for subsequent token requests
        const accessToken = data?.accessToken ?? null;
        try {
          if (accessToken && typeof window !== "undefined") {
            localStorage.setItem(`streamAccess:${streamId}`, accessToken);
          }
        } catch {
          // ignore localStorage errors
        }

        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || "Incorrect password. Please try again.");
      }
    } catch (error) {
      console.error("Password verification error:", error);
      setError("Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Password Required</DialogTitle>
          <DialogDescription className="text-center">
            This is a private stream. Please enter the password to watch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter stream password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isVerifying}
              autoFocus
              className="text-center text-lg"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isVerifying || !password.trim()}>
            {isVerifying ? "Verifying..." : "Access Stream"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-4">
          Contact the memorial organizer if you don&apos;t have the password.
        </p>
      </DialogContent>
    </Dialog>
  );
}
