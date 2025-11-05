interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PWAMetrics {
  serviceWorkerRegistrationTime?: number;
  pushNotificationPermissionTime?: number;
  backgroundSyncRegistrationTime?: number;
  cacheHitRate?: number;
  offlineRequests?: number;
  onlineRequests?: number;
  syncAllTime?: number;
  pushNotificationProcessingTime?: number;
  backgroundSyncProcessingTime?: number;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: number;
  context: string;
  userAgent: string;
  url: string;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorEvent[] = [];
  private pwaMetrics: PWAMetrics = {};
  private isEnabled = true;

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    // Only initialize client-side features if window is available
    if (typeof window !== "undefined") {
      this.initializeErrorTracking();
      this.initializePerformanceTracking();
    }
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    console.log(`Performance metric recorded: ${name} = ${value}`, metadata);
  }

  // Record PWA-specific metrics
  recordPWAMetric(metric: keyof PWAMetrics, value: number): void {
    if (!this.isEnabled) return;

    this.pwaMetrics[metric] = value;
    this.recordMetric(`pwa.${metric}`, value);
  }

  // Record an error
  recordError(error: Error, context: string): void {
    if (!this.isEnabled) return;

    const errorEvent: ErrorEvent = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
      url: typeof window !== "undefined" ? window.location.href : "Server",
    };

    this.errors.push(errorEvent);
    console.error(`Error recorded in context "${context}":`, error);
  }

  // Track service worker events
  trackServiceWorkerEvent(event: string, data?: Record<string, unknown>): void {
    this.recordMetric(`sw.${event}`, 1, data);
  }

  // Track push notification events
  trackPushNotificationEvent(event: string, data?: Record<string, unknown>): void {
    this.recordMetric(`push.${event}`, 1, data);
  }

  // Track background sync events
  trackBackgroundSyncEvent(event: string, data?: Record<string, unknown>): void {
    this.recordMetric(`sync.${event}`, 1, data);
  }

  // Track cache performance
  trackCacheEvent(event: string, data?: Record<string, unknown>): void {
    this.recordMetric(`cache.${event}`, 1, data);
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get PWA metrics
  getPWAMetrics(): PWAMetrics {
    return { ...this.pwaMetrics };
  }

  // Get all errors
  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  // Clear old data (keep last 24 hours)
  clearOldData(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    this.metrics = this.metrics.filter((m) => m.timestamp > oneDayAgo);
    this.errors = this.errors.filter((e) => e.timestamp > oneDayAgo);
  }

  // Export data for analysis
  exportData(): { metrics: PerformanceMetric[]; errors: ErrorEvent[]; pwaMetrics: PWAMetrics } {
    return {
      metrics: this.getMetrics(),
      errors: this.getErrors(),
      pwaMetrics: this.getPWAMetrics(),
    };
  }

  // Send data to analytics service (placeholder)
  async sendToAnalytics(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const data = this.exportData();

      // In a real implementation, this would send to your analytics service
      // For now, just log to console
      console.log("Sending performance data to analytics:", data);

      // Example: Send to Google Analytics, Mixpanel, or your own endpoint
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
    } catch (error) {
      console.error("Failed to send analytics data:", error);
    }
  }

  private initializeErrorTracking(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.recordError(
        new Error(event.message),
        `Global error: ${event.filename}:${event.lineno}:${event.colno}`
      );
    });

    // Unhandled promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.recordError(
        new Error(event.reason?.message || "Unhandled promise rejection"),
        "Unhandled promise rejection"
      );
    });

    // Service worker error tracking
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "ERROR") {
          this.recordError(
            new Error(event.data.error?.message || "Service worker error"),
            "Service Worker"
          );
        }
      });
    }
  }

  private initializePerformanceTracking(): void {
    // Track page load performance
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType(
            "navigation"
          )[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.recordMetric("page.loadTime", navigation.loadEventEnd - navigation.loadEventStart);
            this.recordMetric(
              "page.domContentLoaded",
              navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
            );
          }
        }, 0);
      });
    }

    // Track PWA installation
    window.addEventListener("beforeinstallprompt", () => {
      this.trackServiceWorkerEvent("installPromptShown");
    });

    window.addEventListener("appinstalled", () => {
      this.trackServiceWorkerEvent("appInstalled");
    });

    // Track online/offline status
    window.addEventListener("online", () => {
      this.recordMetric("network.online", 1);
    });

    window.addEventListener("offline", () => {
      this.recordMetric("network.offline", 1);
    });
  }

  // Performance measurement helpers
  startMeasurement(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
    };
  }

  // Measure async operations
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const endMeasurement = this.startMeasurement(name);
    try {
      const result = await operation();
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }
}

// Export singleton instance (lazy-loaded)
let _performanceMonitor: PerformanceMonitoringService | null = null;
export const getPerformanceMonitor = () => {
  if (!_performanceMonitor) {
    _performanceMonitor = PerformanceMonitoringService.getInstance();
  }
  return _performanceMonitor;
};

// For backward compatibility, keep the old export but make it lazy
export const performanceMonitor = {
  get recordMetric() {
    return getPerformanceMonitor().recordMetric.bind(getPerformanceMonitor());
  },
  get recordPWAMetric() {
    return getPerformanceMonitor().recordPWAMetric.bind(getPerformanceMonitor());
  },
  get recordError() {
    return getPerformanceMonitor().recordError.bind(getPerformanceMonitor());
  },
  get trackServiceWorkerEvent() {
    return getPerformanceMonitor().trackServiceWorkerEvent.bind(getPerformanceMonitor());
  },
  get trackPushNotificationEvent() {
    return getPerformanceMonitor().trackPushNotificationEvent.bind(getPerformanceMonitor());
  },
  get trackBackgroundSyncEvent() {
    return getPerformanceMonitor().trackBackgroundSyncEvent.bind(getPerformanceMonitor());
  },
  get trackCacheEvent() {
    return getPerformanceMonitor().trackCacheEvent.bind(getPerformanceMonitor());
  },
  get getMetrics() {
    return getPerformanceMonitor().getMetrics.bind(getPerformanceMonitor());
  },
  get getPWAMetrics() {
    return getPerformanceMonitor().getPWAMetrics.bind(getPerformanceMonitor());
  },
  get getErrors() {
    return getPerformanceMonitor().getErrors.bind(getPerformanceMonitor());
  },
  get clearOldData() {
    return getPerformanceMonitor().clearOldData.bind(getPerformanceMonitor());
  },
  get exportData() {
    return getPerformanceMonitor().exportData.bind(getPerformanceMonitor());
  },
  get sendToAnalytics() {
    return getPerformanceMonitor().sendToAnalytics.bind(getPerformanceMonitor());
  },
  get startMeasurement() {
    return getPerformanceMonitor().startMeasurement.bind(getPerformanceMonitor());
  },
  get measureAsync() {
    return getPerformanceMonitor().measureAsync.bind(getPerformanceMonitor());
  },
  get setEnabled() {
    return getPerformanceMonitor().setEnabled.bind(getPerformanceMonitor());
  },
} as PerformanceMonitoringService;

export default performanceMonitor;
