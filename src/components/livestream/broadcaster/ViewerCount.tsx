"use client";

import React from "react";
import { Users } from "lucide-react";

interface ViewerCountProps {
  count: number;
}

const ViewerCount: React.FC<ViewerCountProps> = ({ count }) => {
  return (
    <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2">
      <Users className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-white">{count}</p>
        <p className="text-xs text-gray-400">Viewers</p>
      </div>
    </div>
  );
};

export default ViewerCount;
