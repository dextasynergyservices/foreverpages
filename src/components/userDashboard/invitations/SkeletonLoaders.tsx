import React from "react";

/**
 * Generic shimmer effect for skeleton loaders
 */
const Shimmer: React.FC = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

/**
 * Skeleton loader for memorial selection dropdown
 */
export const MemorialSelectSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      <div className="relative h-10 bg-muted rounded overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-3 w-48 bg-muted/50 rounded animate-pulse" />
    </div>
  );
};

/**
 * Skeleton loader for invitation list items
 */
export const InvitationListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted/70 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
          </div>

          {/* Delivery icons row */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 pt-2">
            <div className="relative h-9 w-20 bg-muted rounded overflow-hidden">
              <Shimmer />
            </div>
            <div className="relative h-9 w-20 bg-muted rounded overflow-hidden">
              <Shimmer />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for recipient list items
 */
export const RecipientListSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2 p-3 border rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          </div>

          {/* Input fields */}
          <div className="space-y-2">
            <div className="relative h-10 bg-muted rounded overflow-hidden">
              <Shimmer />
            </div>
            <div className="relative h-10 bg-muted rounded overflow-hidden">
              <Shimmer />
            </div>
            <div className="relative h-10 bg-muted rounded overflow-hidden">
              <Shimmer />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Upload progress indicator with percentage
 */
export const UploadProgress: React.FC<{ progress: number; fileName?: string }> = ({
  progress,
  fileName = "Uploading...",
}) => {
  return (
    <div className="space-y-2 p-4 border rounded-lg bg-accent/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1">{fileName}</span>
        <span className="text-sm text-muted-foreground ml-2">{progress}%</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1s_infinite]" />
        </div>
      </div>
    </div>
  );
};

/**
 * Multi-step flow indicator
 */
export const StepIndicator: React.FC<{ currentStep: number; totalSteps?: number }> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const steps = [
    { number: 1, label: "Select Memorial" },
    { number: 2, label: "Add Recipients" },
    { number: 3, label: "Customize Message" },
    { number: 4, label: "Send" },
  ].slice(0, totalSteps);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${
                    step.number === currentStep
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : step.number < currentStep
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {step.number < currentStep ? "✓" : step.number}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium text-center
                  ${step.number === currentStep ? "text-foreground" : "text-muted-foreground"}
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-muted relative overflow-hidden">
                <div
                  className={`
                    absolute inset-y-0 left-0 bg-primary transition-all duration-500
                    ${step.number < currentStep ? "w-full" : "w-0"}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * Simple loading spinner
 */
export const Spinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-muted border-t-primary rounded-full animate-spin`}
    />
  );
};
