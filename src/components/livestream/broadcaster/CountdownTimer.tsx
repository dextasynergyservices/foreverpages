"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaClock, FaCalendar } from "react-icons/fa";
import { format } from "date-fns";

interface CountdownTimerProps {
  scheduledFor: Date | string;
  onCountdownComplete?: () => void;
  showDate?: boolean;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function CountdownTimer({
  scheduledFor,
  onCountdownComplete,
  showDate = true,
  compact = false,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const scheduled = new Date(scheduledFor).getTime();
      const difference = scheduled - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        onCountdownComplete?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: difference });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [scheduledFor, onCountdownComplete]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  const getUrgencyColor = () => {
    const minutesRemaining = timeRemaining.total / (1000 * 60);
    if (minutesRemaining <= 5) return "bg-red-500";
    if (minutesRemaining <= 15) return "bg-orange-500";
    if (minutesRemaining <= 60) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (timeRemaining.total <= 0) {
    return (
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-green-500">
        <CardContent className="py-4">
          <div className="text-center text-white">
            <p className="text-lg font-semibold">Stream is ready to start!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Badge variant="secondary" className={`${getUrgencyColor()} text-white text-sm px-3 py-1`}>
        <FaClock className="mr-2 h-3 w-3" />
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {formatNumber(timeRemaining.hours)}:{formatNumber(timeRemaining.minutes)}:
        {formatNumber(timeRemaining.seconds)}
      </Badge>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-black border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FaClock className="text-purple-400" />
          Stream Starts In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown Display */}
        <div className="grid grid-cols-4 gap-2">
          {/* Days */}
          {timeRemaining.days > 0 && (
            <div className="bg-gradient-to-b from-purple-600 to-purple-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {formatNumber(timeRemaining.days)}
              </div>
              <div className="text-xs text-purple-200 mt-1">Days</div>
            </div>
          )}

          {/* Hours */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">{formatNumber(timeRemaining.hours)}</div>
            <div className="text-xs text-blue-200 mt-1">Hours</div>
          </div>

          {/* Minutes */}
          <div className="bg-gradient-to-b from-indigo-600 to-indigo-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">
              {formatNumber(timeRemaining.minutes)}
            </div>
            <div className="text-xs text-indigo-200 mt-1">Minutes</div>
          </div>

          {/* Seconds */}
          <div className="bg-gradient-to-b from-purple-600 to-purple-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-white">
              {formatNumber(timeRemaining.seconds)}
            </div>
            <div className="text-xs text-purple-200 mt-1">Seconds</div>
          </div>
        </div>

        {/* Scheduled Date */}
        {showDate && (
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <FaCalendar className="h-3 w-3" />
            <span>Scheduled for {format(new Date(scheduledFor), "MMMM d, yyyy 'at' h:mm a")}</span>
          </div>
        )}

        {/* Urgency Warning */}
        {timeRemaining.total / (1000 * 60) <= 5 && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-center">
            <p className="text-red-400 font-semibold text-sm">
              Stream starting in less than 5 minutes!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
