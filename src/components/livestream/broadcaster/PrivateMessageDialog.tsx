"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textArea";
import { FaCommentDots } from "react-icons/fa6";
import { FiSend } from "react-icons/fi";

interface PrivateMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerName: string;
  onSend: (message: string) => Promise<void>;
}

const PrivateMessageDialog: React.FC<PrivateMessageDialogProps> = ({
  open,
  onOpenChange,
  viewerName,
  onSend,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const maxLength = 500;
  const remainingChars = maxLength - message.length;

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onSend(message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaCommentDots className="h-5 w-5 text-blue-500" />
            Send Private Message
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Send a private message to <span className="font-semibold text-white">{viewerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
            placeholder="Type your message here..."
            className="min-h-[120px] bg-gray-800 border-gray-700 text-white resize-none"
            maxLength={maxLength}
          />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Private messages are only visible to the recipient
            </span>
            <span className={`${remainingChars < 50 ? "text-yellow-500" : "text-gray-400"}`}>
              {remainingChars} / {maxLength}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <FiSend className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrivateMessageDialog;
