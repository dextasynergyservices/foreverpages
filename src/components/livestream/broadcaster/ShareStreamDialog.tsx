"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaLink,
  FaQrcode,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaEnvelope,
  FaCheck,
} from "react-icons/fa";
import QRCode from "react-qr-code";

interface ShareStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamUrl: string;
  streamId: string;
}

export default function ShareStreamDialog({
  open,
  onOpenChange,
  streamUrl,
}: ShareStreamDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy link");
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Join me live now!`;
    const encodedUrl = encodeURIComponent(streamUrl);
    const encodedText = encodeURIComponent(text);

    let url = "";
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "email":
        url = `mailto:?subject=${encodedText}&body=${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Share Stream</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share this livestream with your audience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="link" className="data-[state=active]:bg-gray-700">
              <FaLink className="mr-2 h-3 w-3" />
              Link
            </TabsTrigger>
            <TabsTrigger value="qr" className="data-[state=active]:bg-gray-700">
              <FaQrcode className="mr-2 h-3 w-3" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            {/* Copy Link */}
            <div className="space-y-2">
              <Label htmlFor="stream-url">Stream URL</Label>
              <div className="flex gap-2">
                <Input
                  id="stream-url"
                  value={streamUrl}
                  readOnly
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  onClick={handleCopyLink}
                  variant={copied ? "default" : "outline"}
                  className={
                    copied
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  }
                >
                  {copied ? <FaCheck className="h-4 w-4" /> : <FaLink className="h-4 w-4" />}
                </Button>
              </div>
              {copied && <p className="text-xs text-green-400">Link copied to clipboard!</p>}
            </div>

            {/* Social Share Buttons */}
            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => shareToSocial("facebook")}
                  className="bg-blue-600 hover:bg-blue-700 border-0 text-white"
                >
                  <FaFacebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareToSocial("twitter")}
                  className="bg-sky-500 hover:bg-sky-600 border-0 text-white"
                >
                  <FaTwitter className="mr-2 h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareToSocial("whatsapp")}
                  className="bg-green-600 hover:bg-green-700 border-0 text-white"
                >
                  <FaWhatsapp className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareToSocial("email")}
                  className="bg-gray-700 hover:bg-gray-600 border-0 text-white"
                >
                  <FaEnvelope className="mr-2 h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="bg-white p-4 rounded-lg">
                <QRCode value={streamUrl} size={200} />
              </div>
              <p className="text-sm text-gray-400 text-center">
                Scan this QR code with a mobile device to join the stream
              </p>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <FaLink className="mr-2 h-4 w-4" />
                Copy Link Instead
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
