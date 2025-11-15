"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Badge } from "@/components/ui/badge";
import { FaEnvelope, FaSms, FaTimes, FaPlus } from "react-icons/fa";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: string;
  streamUrl: string;
}

export default function InviteDialog({
  open,
  onOpenChange,
  streamId,
  streamUrl,
}: InviteDialogProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState(
    `You're invited to join a live memorial service. Click here to watch: ${streamUrl}`
  );
  const [sending, setSending] = useState(false);
  const [inviteType, setInviteType] = useState<"email" | "sms">("email");

  const handleAddRecipient = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Basic validation
    if (inviteType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return; // Invalid email
      }
    } else {
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      if (!phoneRegex.test(trimmed)) {
        return; // Invalid phone
      }
    }

    if (!recipients.includes(trimmed)) {
      setRecipients([...recipients, trimmed]);
      setInputValue("");
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    setRecipients(recipients.filter((r) => r !== recipient));
  };

  const handleSendInvites = async () => {
    if (recipients.length === 0) return;

    setSending(true);
    try {
      const response = await fetch(`/api/streams/${streamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          message,
          type: inviteType,
        }),
      });

      if (!response.ok) throw new Error("Failed to send invites");

      // Reset and close
      setRecipients([]);
      setInputValue("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invites:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Send Invitations</DialogTitle>
          <DialogDescription className="text-gray-400">
            Invite people to watch this livestream via email or SMS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite Type Selector */}
          <div className="flex gap-2">
            <Button
              variant={inviteType === "email" ? "default" : "outline"}
              onClick={() => setInviteType("email")}
              className={
                inviteType === "email"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }
            >
              <FaEnvelope className="mr-2 h-3 w-3" />
              Email
            </Button>
            <Button
              variant={inviteType === "sms" ? "default" : "outline"}
              onClick={() => setInviteType("sms")}
              className={
                inviteType === "sms"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }
            >
              <FaSms className="mr-2 h-3 w-3" />
              SMS
            </Button>
          </div>

          {/* Recipients Input */}
          <div className="space-y-2">
            <Label htmlFor="recipient">
              {inviteType === "email" ? "Email Addresses" : "Phone Numbers"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                placeholder={inviteType === "email" ? "name@example.com" : "+1 (555) 123-4567"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                onClick={handleAddRecipient}
                variant="outline"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <FaPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({recipients.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800/50 rounded-md">
                {recipients.map((recipient) => (
                  <Badge
                    key={recipient}
                    variant="secondary"
                    className="bg-gray-700 text-white pr-1"
                  >
                    {recipient}
                    <button
                      onClick={() => handleRemoveRecipient(recipient)}
                      className="ml-2 hover:text-red-400"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              className="bg-gray-800 border-gray-700 text-white resize-none"
            />
            <p className="text-xs text-gray-400">{message.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendInvites}
            disabled={recipients.length === 0 || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending
              ? "Sending..."
              : `Send ${recipients.length} Invite${recipients.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
