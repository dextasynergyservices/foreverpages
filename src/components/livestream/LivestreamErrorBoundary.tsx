"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Video, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  /** The memorial slug for navigation */
  memorialSlug?: string;
  /** Type of component being wrapped */
  componentType?: "viewer" | "broadcaster" | "dashboard";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary specifically for Livestream components.
 * Provides user-friendly error messages and recovery options
 * for WebRTC, Socket.io, and media-related errors.
 */
export class LivestreamErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("LivestreamErrorBoundary caught error:", error, errorInfo);
    this.setState({ errorInfo });

    // Log to analytics/monitoring (could be extended to send to Sentry, etc.)
    if (typeof window !== "undefined") {
      try {
        // Store error for debugging
        const errorLog = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        };
        const existingLogs = JSON.parse(localStorage.getItem("livestream_error_logs") || "[]");
        existingLogs.push(errorLog);
        // Keep only last 10 errors
        localStorage.setItem("livestream_error_logs", JSON.stringify(existingLogs.slice(-10)));
      } catch {
        // Silent fail for localStorage errors
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleRefresh = () => {
    window.location.reload();
  };

  getErrorType(): "connection" | "media" | "permission" | "generic" {
    const message = this.state.error?.message?.toLowerCase() || "";

    if (
      message.includes("socket") ||
      message.includes("connection") ||
      message.includes("network") ||
      message.includes("timeout")
    ) {
      return "connection";
    }
    if (
      message.includes("media") ||
      message.includes("stream") ||
      message.includes("track") ||
      message.includes("webrtc")
    ) {
      return "media";
    }
    if (
      message.includes("permission") ||
      message.includes("notallowed") ||
      message.includes("denied")
    ) {
      return "permission";
    }
    return "generic";
  }

  getErrorContent() {
    const errorType = this.getErrorType();
    const { componentType = "viewer" } = this.props;

    const errorConfigs = {
      connection: {
        icon: WifiOff,
        title: "Connection Lost",
        description:
          "We're having trouble connecting to the livestream server. This could be due to your internet connection or a temporary server issue.",
        suggestions: [
          "Check your internet connection",
          "Try refreshing the page",
          "Wait a moment and try again",
        ],
      },
      media: {
        icon: Video,
        title: "Media Error",
        description:
          componentType === "broadcaster"
            ? "There was a problem accessing your camera or microphone, or streaming the video."
            : "There was a problem receiving the video stream.",
        suggestions:
          componentType === "broadcaster"
            ? [
                "Check that your camera/microphone are connected",
                "Ensure no other app is using your camera",
                "Try refreshing the page",
              ]
            : [
                "The broadcaster may be experiencing issues",
                "Try refreshing the page",
                "Check back in a moment",
              ],
      },
      permission: {
        icon: AlertTriangle,
        title: "Permission Required",
        description:
          "Camera or microphone access was denied. Please grant permission to start broadcasting.",
        suggestions: [
          "Click the camera icon in your browser's address bar",
          "Select 'Allow' for camera and microphone",
          "Refresh the page after granting permission",
        ],
      },
      generic: {
        icon: AlertTriangle,
        title: "Something Went Wrong",
        description:
          "An unexpected error occurred with the livestream. We apologize for the inconvenience.",
        suggestions: ["Refresh the page to try again", "If the problem persists, contact support"],
      },
    };

    return errorConfigs[errorType];
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { icon: Icon, title, description, suggestions } = this.getErrorContent();
      const { memorialSlug, componentType } = this.props;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Icon className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">{description}</p>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Try these steps:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                    {"\n\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleRefresh}>Refresh Page</Button>
              {memorialSlug && componentType === "viewer" && (
                <Button variant="ghost" onClick={() => (window.location.href = `/${memorialSlug}`)}>
                  <Home className="h-4 w-4 mr-2" />
                  Memorial Page
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LivestreamErrorBoundary;
