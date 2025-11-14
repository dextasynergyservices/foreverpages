"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HealthWarning } from "@/hooks/useStreamHealth";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { MdWarning } from "react-icons/md";

interface HealthWarningsProps {
  warnings: HealthWarning[];
}

const HealthWarnings: React.FC<HealthWarningsProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return null;
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <FaExclamationTriangle className="h-4 w-4" />;
      case "warning":
        return <MdWarning className="h-4 w-4" />;
      case "info":
        return <FaInfoCircle className="h-4 w-4" />;
      default:
        return <FaInfoCircle className="h-4 w-4" />;
    }
  };

  const getAlertClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500/50 bg-red-500/10 text-red-500";
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-500";
      case "info":
        return "border-blue-500/50 bg-blue-500/10 text-blue-500";
      default:
        return "border-gray-500/50 bg-gray-500/10 text-gray-500";
    }
  };

  // Sort by severity (critical > warning > info)
  const sortedWarnings = [...warnings].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="space-y-2">
      {sortedWarnings.map((warning) => (
        <Alert key={warning.id} className={getAlertClass(warning.severity)}>
          <div className="flex items-start gap-2">
            {getIcon(warning.severity)}
            <AlertDescription className="text-xs">{warning.message}</AlertDescription>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default HealthWarnings;
