"use client";

import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TooltipHelpProps {
  title: string;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * Help tooltip component for inline feature explanations
 */
export const TooltipHelp: React.FC<TooltipHelpProps> = ({
  title,
  content,
  side = "top",
  className,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 ${className || ""}`}
        >
          <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
