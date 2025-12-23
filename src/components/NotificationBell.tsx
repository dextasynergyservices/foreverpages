"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  X,
  Trash2,
  MessageSquare,
  Image,
  Flame,
  Flower,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/hooks/useTranslations";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  variant?: "default" | "compact";
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "NEW_TRIBUTE":
      return <MessageSquare className="h-4 w-4" />;
    case "NEW_COMMENT":
      return <MessageSquare className="h-4 w-4" />;
    case "NEW_PHOTO":
      return <Image className="h-4 w-4" aria-label="Photo" />;
    case "NEW_CANDLE":
      return <Flame className="h-4 w-4" />;
    case "NEW_FLOWER":
      return <Flower className="h-4 w-4" />;
    case "MEMORIAL_ANNIVERSARY":
    case "BIRTHDAY_ANNIVERSARY":
      return <Calendar className="h-4 w-4" />;
    case "EXPIRING_SOON":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "NEW_TRIBUTE":
    case "NEW_COMMENT":
      return "text-blue-600 bg-blue-100";
    case "NEW_PHOTO":
      return "text-purple-600 bg-purple-100";
    case "NEW_CANDLE":
    case "NEW_FLOWER":
      return "text-pink-600 bg-pink-100";
    case "MEMORIAL_ANNIVERSARY":
    case "BIRTHDAY_ANNIVERSARY":
      return "text-indigo-600 bg-indigo-100";
    case "EXPIRING_SOON":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export function NotificationBell({ variant = "default" }: NotificationBellProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(t("notifications.markedAsRead") || "Marked as read", {
        duration: 2000,
        icon: "✓",
      });
    },
    onError: () => {
      toast.error(t("notifications.markAsReadError") || "Failed to mark as read");
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to mark all as read");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const count = data.count || 0;
      toast.success(
        t("notifications.allMarkedAsRead") || `All notifications marked as read (${count})`,
        {
          duration: 3000,
          icon: "✓",
        }
      );
    },
    onError: () => {
      toast.error(t("notifications.markAllAsReadError") || "Failed to mark all as read");
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear notifications");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const count = data.count || 0;
      toast.success(t("notifications.allCleared") || `${count} notifications cleared`, {
        duration: 3000,
        icon: "🗑️",
      });
      setIsOpen(false);
    },
    onError: () => {
      toast.error(t("notifications.clearAllError") || "Failed to clear notifications");
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await markAsReadMutation.mutateAsync(notification.id);
      }

      // Close the dropdown
      setIsOpen(false);

      // Navigate to the link if it exists
      const targetLink = notification.link;
      if (targetLink) {
        // Check if the link contains an anchor
        if (targetLink.includes("#")) {
          // For anchor links, use router.push with smooth scrolling
          router.push(targetLink);

          // Add a delay to allow page navigation, then scroll to element
          setTimeout(() => {
            const anchor = targetLink.split("#")[1];
            if (anchor) {
              const element = document.getElementById(anchor);
              if (element) {
                element.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                // Add a subtle highlight animation
                element.style.transition = "background-color 0.3s ease";
                element.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                setTimeout(() => {
                  element.style.backgroundColor = "";
                }, 2000);
              }
            }
          }, 100);
        } else {
          // For regular links, just navigate
          router.push(targetLink);
        }
      }
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size={variant === "compact" ? "sm" : "default"}
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("notifications.bellButton")}
      >
        <Bell className={cn("h-5 w-5", variant === "compact" && "h-4 w-4")} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed lg:absolute top-16 lg:top-auto right-2 lg:right-0 left-2 lg:left-auto mt-0 lg:mt-2 w-auto lg:w-96 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-lg">{t("notifications.title")}</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  title={t("notifications.markAllRead")}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  title={t("notifications.clearAll")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("notifications.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t("notifications.empty")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-accent transition-colors cursor-pointer",
                      !notification.isRead && "bg-accent/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <NotificationItem notification={notification} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const colorClass = getNotificationColor(notification.type);
  const icon = getNotificationIcon(notification.type);

  return (
    <div className="flex gap-3">
      <div className={cn("p-2 rounded-full flex-shrink-0 h-fit", colorClass)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-1">{notification.title}</h4>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export default NotificationBell;
