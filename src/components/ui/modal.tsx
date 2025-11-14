"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: ModalSize;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  hideHeader?: boolean;
  overlayBlur?: boolean;
  customClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  closeOnBackdropClick = true,
  showCloseButton = true,
  hideHeader = false,
  overlayBlur = false,
  customClassName = "",
}: ModalProps) {
  const { theme } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-md",
    lg: "w-full max-w-2xl",
    xl: "w-full max-w-5xl",
    full: "w-[98vw] h-[98vh] m-4",
  };

  const modalContent = isOpen ? (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBlur ? "backdrop-blur-sm" : ""}`}
    >
      <div
        className={`absolute inset-0 transition-opacity ${
          theme === "dark"
            ? "bg-black bg-opacity-50 backdrop-blur-2xl"
            : "bg-white bg-opacity-50 backdrop-blur-2xl"
        }`}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal container */}
      <div
        className={`relative rounded-xl shadow-2xl flex flex-col transform transition-all duration-300 mx-auto
        ${sizeClasses[size]}
        ${size === "full" ? "h-[calc(100vh-2rem)]" : "max-h-[90vh]"}
        ${customClassName}
        ${theme === "dark" ? "bg-black border border-white/20" : "bg-white border border-black/20"}`}
      >
        {/* Header */}
        {!hideHeader && (title || showCloseButton) && (
          <div
            className={`flex items-center justify-between p-6 border-b flex-shrink-0 ${theme === "dark" ? "border-white/20" : "border-black/20"}`}
          >
            {title ? (
              <h2
                className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {title}
              </h2>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <Button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center w-8 h-8 ${theme === "dark" ? "text-white hover:bg-white/20 bg-transparent" : "text-black hover:bg-black/10 bg-transparent"}`}
                aria-label="close modal"
                variant="ghost"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className={`flex-1 overflow-auto ${hideHeader ? "rounded-t-xl" : ""}`}>{children}</div>
      </div>
    </div>
  ) : null;

  if (typeof window === "object" && modalContent) {
    return createPortal(modalContent, document.body);
  }

  return null;
}
