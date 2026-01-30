"use client";

import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: unknown; resetErrorBoundary: () => void }>;
}

function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
        <Button onClick={resetErrorBoundary} className="inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function QueryErrorBoundary({
  children,
  fallback: Fallback = DefaultErrorFallback,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={Fallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// Higher-order component for wrapping components with error boundary
export function withQueryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: unknown; resetErrorBoundary: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <QueryErrorBoundary fallback={fallback}>
      <Component {...props} />
    </QueryErrorBoundary>
  );

  WrappedComponent.displayName = `withQueryErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
