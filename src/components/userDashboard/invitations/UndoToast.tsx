"use client";

import React from "react";
import { toast } from "react-hot-toast";
import { MdUndo } from "react-icons/md";

interface UndoToastProps {
  message: string;
  onUndo: () => void | Promise<void>;
  theme?: "light" | "dark";
}

export const showUndoToast = ({ message, onUndo, theme = "light" }: UndoToastProps) => {
  return toast.custom(
    (t) => (
      <div
        className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-900"
        } shadow-lg rounded-lg pointer-events-auto flex items-center ring-1 ring-black ring-opacity-5 border`}
      >
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium">{message}</p>
              <p className={`mt-1 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                You can undo this action
              </p>
            </div>
          </div>
        </div>
        <div
          className={`flex border-l ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
        >
          <button
            onClick={async () => {
              await onUndo();
              toast.dismiss(t.id);
              toast.success("Action undone", { duration: 2000 });
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              theme === "dark"
                ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                : "text-blue-600 hover:text-blue-500 hover:bg-gray-50"
            }`}
          >
            <MdUndo className="h-4 w-4" />
            Undo
          </button>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`p-2 rounded-r-lg transition-colors ${
            theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    {
      duration: 10000, // 10 seconds to undo
      position: "bottom-center",
    }
  );
};

// Batch undo toast for multiple items
export const showBatchUndoToast = ({
  count,
  itemType = "items",
  onUndo,
  theme = "light",
}: {
  count: number;
  itemType?: string;
  onUndo: () => void | Promise<void>;
  theme?: "light" | "dark";
}) => {
  return showUndoToast({
    message: `${count} ${itemType} deleted`,
    onUndo,
    theme,
  });
};
