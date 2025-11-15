"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FaBolt,
  FaLink,
  FaQrcode,
  FaEnvelope,
  FaDesktop,
  FaPause,
  FaPlay,
  FaCompressArrowsAlt,
} from "react-icons/fa";
import { MdTextFields } from "react-icons/md";
import ShareStreamDialog from "@/components/livestream/broadcaster/ShareStreamDialog";
import InviteDialog from "@/components/livestream/broadcaster/InviteDialog";
import LowerThirdEditor from "@/components/livestream/broadcaster/LowerThirdEditor";

interface QuickActionsPanelProps {
  streamId: string;
  streamUrl: string;
  isStreaming: boolean;
  isPaused: boolean;
  isScreenSharing: boolean;
  onScreenShareToggle: () => void;
  onPauseToggle: () => void;
  onPictureInPicture: () => void;
}

export default function QuickActionsPanel({
  streamId,
  streamUrl,
  isStreaming,
  isPaused,
  isScreenSharing,
  onScreenShareToggle,
  onPauseToggle,
  onPictureInPicture,
}: QuickActionsPanelProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [lowerThirdEditorOpen, setLowerThirdEditorOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      // Success feedback handled by UI
    } catch {
      console.error("Failed to copy link");
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-gray-900 to-black border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FaBolt className="text-purple-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Share Actions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">SHARE</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                disabled={!isStreaming}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <FaLink className="mr-2 h-3 w-3" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                disabled={!isStreaming}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <FaQrcode className="mr-2 h-3 w-3" />
                QR Code
              </Button>
            </div>
          </div>

          {/* Invite */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">INVITE</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
              disabled={!isStreaming}
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <FaEnvelope className="mr-2 h-3 w-3" />
              Send Invitations
            </Button>
          </div>

          {/* Streaming Controls */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onScreenShareToggle}
                disabled={!isStreaming || isPaused}
                className={`${
                  isScreenSharing
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-white/5 border-white/10 text-white"
                } hover:bg-white/10`}
              >
                <FaDesktop className="mr-2 h-3 w-3" />
                {isScreenSharing ? "Camera" : "Screen"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onPictureInPicture}
                disabled={!isStreaming}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <FaCompressArrowsAlt className="mr-2 h-3 w-3" />
                PiP
              </Button>
            </div>
          </div>

          {/* Graphics */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">GRAPHICS</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLowerThirdEditorOpen(true)}
              disabled={!isStreaming}
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <MdTextFields className="mr-2 h-4 w-4" />
              Lower Third
            </Button>
          </div>

          {/* Emergency Pause */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">EMERGENCY</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onPauseToggle}
              disabled={!isStreaming}
              className={`w-full ${
                isPaused
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-red-500/20 border-red-500 text-red-400"
              } hover:opacity-80`}
            >
              {isPaused ? (
                <>
                  <FaPlay className="mr-2 h-3 w-3" />
                  Resume Stream
                </>
              ) : (
                <>
                  <FaPause className="mr-2 h-3 w-3" />
                  Emergency Pause
                </>
              )}
            </Button>
            {isPaused && (
              <Badge variant="destructive" className="w-full justify-center text-xs">
                Stream is paused - Viewers see waiting screen
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ShareStreamDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        streamUrl={streamUrl}
        streamId={streamId}
      />
      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        streamId={streamId}
        streamUrl={streamUrl}
      />
      <LowerThirdEditor
        open={lowerThirdEditorOpen}
        onOpenChange={setLowerThirdEditorOpen}
        streamId={streamId}
      />
    </>
  );
}
