"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FaThumbtack, FaCrown } from "react-icons/fa";
import { FaCommentDots, FaUserSlash } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import toast from "react-hot-toast";

interface ViewerCardProps {
  viewer: {
    id: string;
    userId?: string | null;
    user?: {
      name: string;
      email: string;
      image?: string | null;
    } | null;
    guestName?: string | null;
    isPinned: boolean;
    isVIP: boolean;
    isActive: boolean;
    watchTime: number;
    joinedAt: string;
  };
  onPin: (viewerId: string) => Promise<void>;
  onUnpin: (viewerId: string) => Promise<void>;
  onVIP: (viewerId: string) => Promise<void>;
  onRemoveVIP: (viewerId: string) => Promise<void>;
  onKick: (viewerId: string) => Promise<void>;
  onBan: (viewerId: string) => Promise<void>;
  onMessage: (viewerId: string) => void;
}

const ViewerCard: React.FC<ViewerCardProps> = ({
  viewer,
  onPin,
  onUnpin,
  onVIP,
  onRemoveVIP,
  onKick,
  onBan,
  onMessage,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const displayName = viewer.user?.name || viewer.guestName || "Anonymous";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatWatchTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setIsProcessing(true);
    try {
      await action();
      toast.success(`${actionName} successful`);
    } catch {
      toast.error(`Failed to ${actionName.toLowerCase()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={viewer.user?.image || undefined} alt={displayName} />
          <AvatarFallback className="bg-gray-700 text-white text-xs">{initials}</AvatarFallback>
        </Avatar>
        {viewer.isActive && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{displayName}</p>
          {viewer.isPinned && (
            <Badge
              variant="outline"
              className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
            >
              <FaThumbtack className="h-3 w-3" />
            </Badge>
          )}
          {viewer.isVIP && (
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-500 border-purple-500/30"
            >
              <FaCrown className="h-3 w-3" />
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{formatWatchTime(viewer.watchTime)}</span>
          {viewer.userId && <span>• Registered</span>}
          {!viewer.userId && <span>• Guest</span>}
        </div>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            disabled={isProcessing}
          >
            <BsThreeDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
          <DropdownMenuLabel className="text-gray-300">Manage Viewer</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />

          {/* Pin/Unpin */}
          {viewer.isPinned ? (
            <DropdownMenuItem
              onClick={() => handleAction(() => onUnpin(viewer.id), "Unpin")}
              className="text-gray-300 hover:bg-gray-700 cursor-pointer"
            >
              <FaThumbtack className="h-4 w-4 mr-2 opacity-50" />
              Unpin Viewer
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleAction(() => onPin(viewer.id), "Pin")}
              className="text-gray-300 hover:bg-gray-700 cursor-pointer"
            >
              <FaThumbtack className="h-4 w-4 mr-2" />
              Pin Viewer
            </DropdownMenuItem>
          )}

          {/* VIP */}
          {viewer.isVIP ? (
            <DropdownMenuItem
              onClick={() => handleAction(() => onRemoveVIP(viewer.id), "Remove VIP")}
              className="text-gray-300 hover:bg-gray-700 cursor-pointer"
            >
              <FaCrown className="h-4 w-4 mr-2 opacity-50" />
              Remove VIP
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleAction(() => onVIP(viewer.id), "Make VIP")}
              className="text-gray-300 hover:bg-gray-700 cursor-pointer"
            >
              <FaCrown className="h-4 w-4 mr-2" />
              Make VIP
            </DropdownMenuItem>
          )}

          {/* Private Message */}
          {viewer.userId && (
            <>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={() => onMessage(viewer.id)}
                className="text-gray-300 hover:bg-gray-700 cursor-pointer"
              >
                <FaCommentDots className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
            </>
          )}

          {/* Kick */}
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={() => handleAction(() => onKick(viewer.id), "Kick")}
            className="text-orange-400 hover:bg-orange-500/10 cursor-pointer"
          >
            <FaUserSlash className="h-4 w-4 mr-2" />
            Kick Viewer
          </DropdownMenuItem>

          {/* Ban */}
          <DropdownMenuItem
            onClick={() => handleAction(() => onBan(viewer.id), "Ban")}
            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            <FaUserSlash className="h-4 w-4 mr-2" />
            Ban Permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ViewerCard;
