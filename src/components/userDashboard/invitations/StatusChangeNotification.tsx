"use client";

import React from "react";
import { toast } from "react-hot-toast";
import { MdCheckCircle, MdCancel, MdHelpOutline } from "react-icons/md";

interface InvitationStatusChange {
  invitationId: string;
  oldStatus: string;
  newStatus: string;
  guestName: string;
}

export const showStatusChangeNotification = (
  change: InvitationStatusChange,
  theme: "light" | "dark"
) => {
  const { guestName, newStatus } = change;

  const getStatusIcon = () => {
    switch (newStatus) {
      case "ACCEPTED":
        return <MdCheckCircle className="h-5 w-5 text-green-500" />;
      case "DECLINED":
        return <MdCancel className="h-5 w-5 text-red-500" />;
      case "MAYBE":
        return <MdHelpOutline className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (newStatus) {
      case "ACCEPTED":
        return `${guestName} accepted the invitation! 🎉`;
      case "DECLINED":
        return `${guestName} declined the invitation`;
      case "MAYBE":
        return `${guestName} responded "Maybe"`;
      default:
        return `${guestName}'s invitation status changed`;
    }
  };

  const getStatusColor = () => {
    switch (newStatus) {
      case "ACCEPTED":
        return theme === "dark" ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200";
      case "DECLINED":
        return theme === "dark" ? "bg-red-900 border-red-700" : "bg-red-50 border-red-200";
      case "MAYBE":
        return theme === "dark"
          ? "bg-yellow-900 border-yellow-700"
          : "bg-yellow-50 border-yellow-200";
      default:
        return theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";
    }
  };

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full ${getStatusColor()} shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border`}
      >
        {getStatusIcon()}
        <div className="flex-1">
          <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            {getStatusMessage()}
          </p>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Just now
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`rounded-md p-1 transition-colors ${
            theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
          }`}
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    ),
    { duration: 5000, position: "top-right" }
  );
};

// Batch notification for multiple changes
export const showBatchStatusChangeNotification = (
  changes: InvitationStatusChange[],
  theme: "light" | "dark"
) => {
  const acceptedCount = changes.filter((c) => c.newStatus === "ACCEPTED").length;
  const declinedCount = changes.filter((c) => c.newStatus === "DECLINED").length;
  const maybeCount = changes.filter((c) => c.newStatus === "MAYBE").length;

  const message: string[] = [];
  if (acceptedCount > 0) message.push(`${acceptedCount} accepted`);
  if (declinedCount > 0) message.push(`${declinedCount} declined`);
  if (maybeCount > 0) message.push(`${maybeCount} maybe`);

  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border`}
      >
        <MdCheckCircle className="h-5 w-5 text-blue-500" />
        <div className="flex-1">
          <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            {changes.length} invitation{changes.length > 1 ? "s" : ""} updated
          </p>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            {message.join(", ")}
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`rounded-md p-1 transition-colors ${
            theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
          }`}
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    ),
    { duration: 5000, position: "top-right" }
  );
};
