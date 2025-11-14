import toast from "react-hot-toast";
import { Heart, Calendar, AlertCircle, MessageSquare } from "lucide-react";

/**
 * Toast Notification Helpers
 * Provides consistent toast notifications throughout the app
 */

export const toastNotification = {
  // Success notifications
  success: (message: string, duration = 3000) => {
    toast.success(message, { duration });
  },

  // Error notifications
  error: (message: string, duration = 5000) => {
    toast.error(message, { duration });
  },

  // Info notifications
  info: (message: string, duration = 4000) => {
    toast(message, {
      duration,
      icon: "ℹ️",
    });
  },

  // New tribute notification
  newTribute: (tributeAuthorName: string) => {
    toast.success(
      () => (
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">New Tribute</p>
            <p className="text-sm text-gray-600">{tributeAuthorName} posted a new tribute</p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: {
          maxWidth: "400px",
        },
      }
    );
  },

  // New comment notification
  newComment: (commenterName: string) => {
    toast(
      () => (
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">New Comment</p>
            <p className="text-sm text-gray-600">{commenterName} left a comment</p>
          </div>
        </div>
      ),
      {
        duration: 4000,
      }
    );
  },

  // Virtual candle lit notification
  candleLit: (senderName: string) => {
    toast(
      () => (
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-pink-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Virtual Candle Lit</p>
            <p className="text-sm text-gray-600">{senderName} lit a candle in memory</p>
          </div>
        </div>
      ),
      {
        duration: 4000,
      }
    );
  },

  // Anniversary reminder
  anniversary: (message: string) => {
    toast(
      () => (
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Anniversary Reminder</p>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      ),
      {
        duration: 6000,
      }
    );
  },

  // Expiring memorial warning
  expiringWarning: (daysRemaining: number) => {
    toast(
      () => (
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Memorial Expiring Soon</p>
            <p className="text-sm text-gray-600">
              Your memorial expires in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
            </p>
          </div>
        </div>
      ),
      {
        duration: 8000,
      }
    );
  },

  // Custom notification with icon
  custom: (title: string, message: string, icon?: React.ReactNode, duration = 4000) => {
    toast(
      () => (
        <div className="flex items-start gap-3">
          {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      ),
      {
        duration,
      }
    );
  },

  // Loading notification (returns toast ID for dismissal)
  loading: (message: string) => {
    return toast.loading(message);
  },

  // Dismiss a specific toast
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  // Promise-based toast (for async operations)
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

export default toastNotification;
