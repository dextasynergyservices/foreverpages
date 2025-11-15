"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaStopwatch, FaExclamationTriangle } from "react-icons/fa";
import { MdWarning } from "react-icons/md";

interface StreamDurationTimerProps {
  startedAt: Date | string;
  scheduledEndTime?: Date | string | null;
  maxDuration?: number; // in minutes
  warningThresholds?: number[]; // minutes before end to show warnings
  onWarning?: (minutesRemaining: number) => void;
  onTimeUp?: () => void;
  compact?: boolean;
}

interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export default function StreamDurationTimer({
  startedAt,
  scheduledEndTime,
  maxDuration,
  warningThresholds = [5, 15, 30],
  onWarning,
  onTimeUp,
  compact = false,
}: StreamDurationTimerProps) {
  const [duration, setDuration] = useState<Duration>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());

  useEffect(() => {
    const calculateDuration = () => {
      const now = new Date().getTime();
      const start = new Date(startedAt).getTime();
      const elapsed = now - start;

      const totalSeconds = Math.floor(elapsed / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setDuration({ hours, minutes, seconds, totalSeconds });

      // Check for scheduled end time
      if (scheduledEndTime) {
        const endTime = new Date(scheduledEndTime).getTime();
        const remaining = endTime - now;
        const minutesRemaining = Math.floor(remaining / (1000 * 60));

        // Show warnings at thresholds
        warningThresholds.forEach((threshold) => {
          if (
            minutesRemaining <= threshold &&
            minutesRemaining > 0 &&
            !warningsShown.has(threshold)
          ) {
            setWarningsShown((prev) => new Set(prev).add(threshold));
            onWarning?.(minutesRemaining);
          }
        });

        // Time is up
        if (remaining <= 0 && duration.totalSeconds > 0) {
          onTimeUp?.();
        }
      }

      // Check for max duration
      if (maxDuration) {
        const maxSeconds = maxDuration * 60;
        const remaining = maxSeconds - totalSeconds;
        const minutesRemaining = Math.floor(remaining / 60);

        // Show warnings at thresholds
        warningThresholds.forEach((threshold) => {
          if (
            minutesRemaining <= threshold &&
            minutesRemaining > 0 &&
            !warningsShown.has(threshold)
          ) {
            setWarningsShown((prev) => new Set(prev).add(threshold));
            onWarning?.(minutesRemaining);
          }
        });

        // Max duration reached
        if (remaining <= 0) {
          onTimeUp?.();
        }
      }
    };

    calculateDuration();
    const interval = setInterval(calculateDuration, 1000);

    return () => clearInterval(interval);
  }, [
    startedAt,
    scheduledEndTime,
    maxDuration,
    warningThresholds,
    onWarning,
    onTimeUp,
    warningsShown,
    duration.totalSeconds,
  ]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  const getTimeRemaining = () => {
    if (scheduledEndTime) {
      const now = new Date().getTime();
      const endTime = new Date(scheduledEndTime).getTime();
      const remaining = endTime - now;
      return Math.max(0, Math.floor(remaining / (1000 * 60)));
    }
    if (maxDuration) {
      const maxSeconds = maxDuration * 60;
      const remaining = maxSeconds - duration.totalSeconds;
      return Math.max(0, Math.floor(remaining / 60));
    }
    return null;
  };

  const minutesRemaining = getTimeRemaining();

  const getStatusColor = () => {
    if (minutesRemaining === null) return "bg-blue-500";
    if (minutesRemaining <= 5) return "bg-red-500";
    if (minutesRemaining <= 15) return "bg-orange-500";
    if (minutesRemaining <= 30) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (compact) {
    return (
      <Badge variant="secondary" className={`${getStatusColor()} text-white text-sm px-3 py-1`}>
        <FaStopwatch className="mr-2 h-3 w-3" />
        {formatNumber(duration.hours)}:{formatNumber(duration.minutes)}:
        {formatNumber(duration.seconds)}
        {minutesRemaining !== null && ` (${minutesRemaining}m left)`}
      </Badge>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FaStopwatch className="text-blue-400" />
          Stream Duration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Duration Display */}
        <div className="grid grid-cols-3 gap-2">
          {/* Hours */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">{formatNumber(duration.hours)}</div>
            <div className="text-xs text-blue-200 mt-1">Hours</div>
          </div>

          {/* Minutes */}
          <div className="bg-gradient-to-b from-indigo-600 to-indigo-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">{formatNumber(duration.minutes)}</div>
            <div className="text-xs text-indigo-200 mt-1">Minutes</div>
          </div>

          {/* Seconds */}
          <div className="bg-gradient-to-b from-purple-600 to-purple-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">{formatNumber(duration.seconds)}</div>
            <div className="text-xs text-purple-200 mt-1">Seconds</div>
          </div>
        </div>

        {/* Time Remaining Warning */}
        {minutesRemaining !== null && minutesRemaining <= 30 && (
          <Alert
            className={`${
              minutesRemaining <= 5
                ? "bg-red-500/20 border-red-500"
                : minutesRemaining <= 15
                  ? "bg-orange-500/20 border-orange-500"
                  : "bg-yellow-500/20 border-yellow-500"
            }`}
          >
            <div className="flex items-center gap-2">
              {minutesRemaining <= 5 ? (
                <FaExclamationTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <MdWarning className="h-4 w-4 text-yellow-400" />
              )}
              <AlertDescription
                className={`${
                  minutesRemaining <= 5
                    ? "text-red-400"
                    : minutesRemaining <= 15
                      ? "text-orange-400"
                      : "text-yellow-400"
                } font-semibold text-sm`}
              >
                {minutesRemaining <= 1
                  ? "Stream ending in less than 1 minute!"
                  : `Stream ending in ${minutesRemaining} minutes`}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* End Time Info */}
        {scheduledEndTime && (
          <div className="text-center text-gray-400 text-sm">
            <p>
              Scheduled to end at{" "}
              {new Date(scheduledEndTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
