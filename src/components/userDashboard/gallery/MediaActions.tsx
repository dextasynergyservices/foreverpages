import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";

interface MediaActionsProps {
  theme: string;
  onView: () => void;
  onDelete: () => void;
}

export const MediaActions: React.FC<MediaActionsProps> = ({ theme, onView, onDelete }) => {
  return (
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
      <Button variant={theme === "dark" ? "memorial-ghost" : "outline"} size="sm" onClick={onView}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
