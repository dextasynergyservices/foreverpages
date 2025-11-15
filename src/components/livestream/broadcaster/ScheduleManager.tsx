"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FaCalendarAlt, FaRocket, FaClock } from "react-icons/fa";
import { MdNotifications } from "react-icons/md";
import toast from "react-hot-toast";

interface ScheduleManagerProps {
  streamId: string;
  scheduledFor: Date | string | null;
  scheduledEnd: Date | string | null;
  autoStart: boolean;
  autoEnd: boolean;
  onAutoStartChange: (enabled: boolean) => void;
  onAutoEndChange: (enabled: boolean) => void;
  onManualStart: () => void;
}

export default function ScheduleManager({
  streamId,
  scheduledFor,
  scheduledEnd,
  autoStart,
  autoEnd,
  onAutoStartChange,
  onAutoEndChange,
  onManualStart,
}: ScheduleManagerProps) {
  const [reminderSent, setReminderSent] = useState(false);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);

  const sendReminder = useCallback(async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/reminder`, {
        method: "POST",
      });

      if (response.ok) {
        toast("📢 5-minute reminder sent to all invited guests!", {
          icon: "🔔",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Failed to send reminder:", error);
    }
  }, [streamId]);

  useEffect(() => {
    if (!scheduledFor) return;

    const checkSchedule = () => {
      const now = new Date().getTime();
      const scheduled = new Date(scheduledFor).getTime();
      const timeDiff = scheduled - now;
      const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));

      // Send 5-minute reminder
      if (minutesUntilStart === 5 && !reminderSent) {
        sendReminder();
        setReminderSent(true);
      }

      // Auto-start countdown (10 seconds before)
      if (autoStart && timeDiff > 0 && timeDiff <= 10000) {
        setAutoStartCountdown(Math.ceil(timeDiff / 1000));
      }

      // Auto-start trigger
      if (autoStart && timeDiff <= 0 && timeDiff > -5000) {
        onManualStart();
        toast.success("Stream started automatically!");
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 1000);

    return () => clearInterval(interval);
  }, [scheduledFor, autoStart, reminderSent, onManualStart, sendReminder]);

  const handleTestReminder = async () => {
    await sendReminder();
  };

  if (!scheduledFor) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
        <CardContent className="py-6">
          <div className="text-center text-gray-400">
            <FaCalendarAlt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No schedule set for this stream</p>
            <p className="text-sm mt-1">Edit stream to add scheduling</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isScheduledInFuture = new Date(scheduledFor).getTime() > new Date().getTime();

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FaCalendarAlt className="text-purple-400" />
          Schedule Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schedule Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Start Time:</span>
            <Badge variant="outline" className="text-white">
              <FaClock className="mr-2 h-3 w-3" />
              {new Date(scheduledFor).toLocaleString()}
            </Badge>
          </div>

          {scheduledEnd && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">End Time:</span>
              <Badge variant="outline" className="text-white">
                <FaClock className="mr-2 h-3 w-3" />
                {new Date(scheduledEnd).toLocaleString()}
              </Badge>
            </div>
          )}
        </div>

        {/* Auto-Start Toggle */}
        {isScheduledInFuture && (
          <>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <FaRocket className="h-4 w-4 text-green-400" />
                <div>
                  <Label htmlFor="auto-start" className="text-white cursor-pointer">
                    Auto-Start
                  </Label>
                  <p className="text-xs text-gray-400">Go live at scheduled time</p>
                </div>
              </div>
              <Switch id="auto-start" checked={autoStart} onCheckedChange={onAutoStartChange} />
            </div>

            {/* Auto-Start Countdown */}
            {autoStartCountdown !== null && autoStartCountdown > 0 && (
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-center animate-pulse">
                <p className="text-green-400 font-semibold">
                  Auto-starting in {autoStartCountdown} seconds...
                </p>
              </div>
            )}
          </>
        )}

        {/* Auto-End Toggle */}
        {scheduledEnd && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <FaClock className="h-4 w-4 text-orange-400" />
              <div>
                <Label htmlFor="auto-end" className="text-white cursor-pointer">
                  Auto-End
                </Label>
                <p className="text-xs text-gray-400">Stop stream at scheduled end time</p>
              </div>
            </div>
            <Switch id="auto-end" checked={autoEnd} onCheckedChange={onAutoEndChange} />
          </div>
        )}

        {/* Reminder Button */}
        <Button
          variant="outline"
          onClick={handleTestReminder}
          className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
        >
          <MdNotifications className="mr-2 h-4 w-4" />
          Send Reminder Now
        </Button>
      </CardContent>
    </Card>
  );
}
