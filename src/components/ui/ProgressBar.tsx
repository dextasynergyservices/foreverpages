import React from "react";

interface ProgressBarProps {
  percentage: number;
  theme: string;
  bgMuted: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, theme, bgMuted }) => {
  return (
    <div className={`w-full rounded-full h-2 ${bgMuted}`}>
      <div
        className={`rounded-full h-2 transition-all ${theme === "dark" ? "bg-white" : "bg-black"}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
