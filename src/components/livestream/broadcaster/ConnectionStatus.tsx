"use client";

import React from "react";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div
      className={`flex items-center gap-2 border rounded-lg px-4 py-2 ${
        isConnected
          ? "bg-green-500/10 border-green-500/20 text-green-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}
    >
      {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
      <div>
        <p className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</p>
        <p className="text-xs opacity-70">{isConnected ? "Broadcasting" : "No connection"}</p>
      </div>
    </div>
  );
};

export default ConnectionStatus;
