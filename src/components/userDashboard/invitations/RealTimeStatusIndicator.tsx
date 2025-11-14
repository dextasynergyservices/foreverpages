"use client";

import React, { useState, useEffect } from "react";
import { MdSync, MdCheckCircle, MdError } from "react-icons/md";
import { toast } from "react-hot-toast";

interface RealTimeStatusIndicatorProps {
  isPolling: boolean;
  lastUpdate?: Date;
  onRefresh: () => void;
  theme: "light" | "dark";
  t: (key: string, params?: Record<string, unknown>, fallback?: string) => string;
}

const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  isPolling,
  lastUpdate,
  onRefresh,
  theme,
  t,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = now - lastUpdate.getTime();
      const seconds = Math.floor(diff / 1000);

      if (seconds < 60) {
        setTimeSinceUpdate(t("invitations.realtime.justNow", {}, "Just now"));
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceUpdate(
          t("invitations.realtime.minutesAgo", { count: minutes }, `${minutes}m ago`)
        );
      } else {
        setTimeSinceUpdate(t("invitations.realtime.longAgo", {}, "Over an hour ago"));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastUpdate, t]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success("Updated successfully");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
        theme === "dark"
          ? "bg-gray-800 border border-gray-700"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {isPolling ? (
          <>
            <div className="relative">
              <MdCheckCircle className="h-4 w-4 text-green-500" />
              <div className="absolute inset-0 animate-ping">
                <MdCheckCircle className="h-4 w-4 text-green-500 opacity-75" />
              </div>
            </div>
            <span
              className={`text-sm font-medium ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}
            >
              {t("invitations.realtime.live", {}, "Live")}
            </span>
          </>
        ) : (
          <>
            <MdError className="h-4 w-4 text-gray-400" />
            <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {t("invitations.realtime.paused", {}, "Paused")}
            </span>
          </>
        )}
      </div>

      {/* Last Update Time */}
      {lastUpdate && (
        <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          {timeSinceUpdate}
        </span>
      )}

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`ml-auto p-1.5 rounded-md transition-colors ${
          theme === "dark"
            ? "hover:bg-gray-700 text-gray-400 hover:text-white"
            : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={t("invitations.realtime.refresh", {}, "Refresh now")}
      >
        <MdSync className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};

export default RealTimeStatusIndicator;
