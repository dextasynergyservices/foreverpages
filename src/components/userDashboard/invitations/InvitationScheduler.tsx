"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MdSchedule, MdSend, MdClose } from "react-icons/md";

interface InvitationSchedulerProps {
  onSchedule: (scheduledDate: Date | null, sendReminders: boolean, reminderDays: number[]) => void;
  onClose: () => void;
  theme: "light" | "dark";
  themeClasses: {
    card: string;
    text: string;
    mutedText: string;
    input: string;
    button: string;
  };
  t: (key: string, params?: Record<string, unknown>, fallback?: string) => string;
}

const InvitationScheduler: React.FC<InvitationSchedulerProps> = ({
  onSchedule,
  onClose,
  theme,
  themeClasses,
  t,
}) => {
  const [sendNow, setSendNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sendReminders, setSendReminders] = useState(true);
  const [reminder7Days, setReminder7Days] = useState(true);
  const [reminder3Days, setReminder3Days] = useState(true);
  const [reminder1Day, setReminder1Day] = useState(true);

  const handleConfirm = () => {
    let scheduledDateTime: Date | null = null;

    if (!sendNow && scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    }

    const reminderDays: number[] = [];
    if (sendReminders) {
      if (reminder7Days) reminderDays.push(7);
      if (reminder3Days) reminderDays.push(3);
      if (reminder1Day) reminderDays.push(1);
    }

    onSchedule(scheduledDateTime, sendReminders, reminderDays);
  };

  const isValidSchedule = sendNow || (scheduledDate && scheduledTime);
  const minDate = new Date().toISOString().split("T")[0];
  const minTime = scheduledDate === minDate ? new Date().toTimeString().slice(0, 5) : "00:00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card
        className={`${themeClasses.card} w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                {t("dashboard.invitations.scheduling.title", {}, "Schedule Invitation")}
              </h2>
              <p className={themeClasses.mutedText}>
                {t(
                  "dashboard.invitations.scheduling.description",
                  {},
                  "Choose when to send this invitation"
                )}
              </p>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className={themeClasses.button}>
              <MdClose className="h-5 w-5" />
            </Button>
          </div>

          {/* Send Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="sendNow"
                checked={sendNow}
                onCheckedChange={(checked) => setSendNow(checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <MdSend className={`h-5 w-5 ${themeClasses.mutedText}`} />
                <Label htmlFor="sendNow" className={`${themeClasses.text} cursor-pointer`}>
                  {t("dashboard.invitations.scheduling.sendNow", {}, "Send immediately")}
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="scheduleLater"
                checked={!sendNow}
                onCheckedChange={(checked) => setSendNow(!(checked as boolean))}
              />
              <div className="flex items-center gap-2">
                <MdSchedule className={`h-5 w-5 ${themeClasses.mutedText}`} />
                <Label htmlFor="scheduleLater" className={`${themeClasses.text} cursor-pointer`}>
                  {t("dashboard.invitations.scheduling.scheduleLater", {}, "Schedule for later")}
                </Label>
              </div>
            </div>
          </div>

          {/* Schedule Date/Time */}
          {!sendNow && (
            <div
              className="space-y-4 p-4 rounded-lg border"
              style={{ borderColor: theme === "dark" ? "#374151" : "#e5e7eb" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={themeClasses.text}>
                    {t("dashboard.invitations.scheduling.date", {}, "Date")}
                  </Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={minDate}
                    className={themeClasses.input}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={themeClasses.text}>
                    {t("dashboard.invitations.scheduling.time", {}, "Time")}
                  </Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={minTime}
                    className={themeClasses.input}
                  />
                </div>
              </div>
              {scheduledDate && scheduledTime && (
                <p className={`text-sm ${themeClasses.mutedText}`}>
                  {t("dashboard.invitations.scheduling.willSend", {}, "Will be sent on")}{" "}
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Reminder Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="sendReminders"
                checked={sendReminders}
                onCheckedChange={(checked) => setSendReminders(checked as boolean)}
              />
              <Label
                htmlFor="sendReminders"
                className={`${themeClasses.text} font-semibold cursor-pointer`}
              >
                {t("dashboard.invitations.reminders.enable", {}, "Send automatic reminders")}
              </Label>
            </div>

            {sendReminders && (
              <div
                className="ml-8 space-y-3 p-4 rounded-lg border"
                style={{ borderColor: theme === "dark" ? "#374151" : "#e5e7eb" }}
              >
                <p className={`text-sm ${themeClasses.mutedText} mb-2`}>
                  {t(
                    "dashboard.invitations.reminders.description",
                    {},
                    "Automatic reminders will be sent before the service date"
                  )}
                </p>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="reminder7"
                    checked={reminder7Days}
                    onCheckedChange={(checked) => setReminder7Days(checked as boolean)}
                  />
                  <Label htmlFor="reminder7" className={`${themeClasses.text} cursor-pointer`}>
                    {t("dashboard.invitations.reminders.days7", {}, "7 days before")}
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="reminder3"
                    checked={reminder3Days}
                    onCheckedChange={(checked) => setReminder3Days(checked as boolean)}
                  />
                  <Label htmlFor="reminder3" className={`${themeClasses.text} cursor-pointer`}>
                    {t("dashboard.invitations.reminders.days3", {}, "3 days before")}
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="reminder1"
                    checked={reminder1Day}
                    onCheckedChange={(checked) => setReminder1Day(checked as boolean)}
                  />
                  <Label htmlFor="reminder1" className={`${themeClasses.text} cursor-pointer`}>
                    {t("dashboard.invitations.reminders.days1", {}, "1 day before")}
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              className={`flex-1 ${themeClasses.button}`}
              disabled={!isValidSchedule}
            >
              {sendNow
                ? t("dashboard.invitations.scheduling.confirm", {}, "Confirm & Send")
                : t("dashboard.invitations.scheduling.schedule", {}, "Schedule Invitation")}
            </Button>
            <Button onClick={onClose} variant="outline" className={themeClasses.button}>
              {t("common.cancel", {}, "Cancel")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvitationScheduler;
