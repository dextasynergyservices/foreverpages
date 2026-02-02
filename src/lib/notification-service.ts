/**
 * Unified Notification Service
 *
 * Central service for sending notifications across multiple channels:
 * - Email (via Brevo)
 * - WhatsApp (via Green API)
 * - SMS (via Twilio)
 * - Future: Push Notifications
 *
 * Features:
 * - User preference management (opt-in/opt-out per channel)
 * - Batch sending for multiple recipients
 * - Error handling and logging
 * - Queue system for large batches (future enhancement)
 */

import {
  sendStreamScheduledEmail,
  sendStreamLiveEmail,
  sendStreamEndedEmail,
  sendRecordingReadyEmail,
  sendRecordingExpiringEmail,
  sendRecordingDeletedEmail,
} from "@/lib/livestream-email-service";

import {
  sendStreamScheduledWhatsApp,
  sendStreamLiveWhatsApp,
  sendStreamEndedWhatsApp,
  sendRecordingReadyWhatsApp,
  sendRecordingExpiringWhatsApp,
  sendRecordingDeletedWhatsApp,
} from "@/lib/whatsapp-service";

import {
  sendStreamScheduledSMS,
  sendStreamLiveSMS,
  sendRecordingReadySMS,
  isSMSConfigured,
} from "@/lib/sms-service";

import { prisma } from "@/lib/prisma";

/**
 * Notification event types
 */
export enum NotificationEvent {
  STREAM_SCHEDULED = "STREAM_SCHEDULED",
  STREAM_LIVE = "STREAM_LIVE",
  STREAM_ENDED = "STREAM_ENDED",
  RECORDING_READY = "RECORDING_READY",
  RECORDING_EXPIRING = "RECORDING_EXPIRING",
  RECORDING_DELETED = "RECORDING_DELETED",
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
  PUSH = "PUSH", // Future
}

/**
 * Common notification parameters
 */
interface BaseNotificationParams {
  memorialName: string;
  streamTitle: string;
  streamUrl?: string;
}

/**
 * Stream scheduled notification parameters
 */
interface StreamScheduledParams extends BaseNotificationParams {
  scheduledFor: Date;
  streamUrl: string;
}

/**
 * Stream live notification parameters
 */
interface StreamLiveParams extends BaseNotificationParams {
  streamUrl: string;
}

/**
 * Stream ended notification parameters
 */
interface StreamEndedParams extends BaseNotificationParams {
  duration: string;
  peakViewers: number;
  totalComments: number;
}

/**
 * Recording ready notification parameters
 */
interface RecordingReadyParams extends BaseNotificationParams {
  recordingUrl: string;
  expiresAt: Date;
}

/**
 * Recording expiring notification parameters
 */
interface RecordingExpiringParams extends BaseNotificationParams {
  recordingUrl: string;
  expiresAt: Date;
  daysRemaining: number;
}

/**
 * Recording deleted notification parameters
 */
interface RecordingDeletedParams extends BaseNotificationParams {
  deletedAt: Date;
}

/**
 * Union type for all notification parameters
 */
type NotificationParams =
  | StreamScheduledParams
  | StreamLiveParams
  | StreamEndedParams
  | RecordingReadyParams
  | RecordingExpiringParams
  | RecordingDeletedParams;

/**
 * Notification result
 */
interface NotificationResult {
  success: boolean;
  sentChannels: NotificationChannel[];
  errors: { channel: NotificationChannel; error: string }[];
}

/**
 * User notification preferences
 */
interface UserNotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
}

/**
 * Get user notification preferences
 * For now, use default preferences. In future, read from User model.
 */
async function getUserPreferences(): Promise<UserNotificationPreferences> {
  // TODO: Read from User model fields (emailNotifications, whatsappNotifications, smsNotifications, etc.)
  // For now, default to email only (WhatsApp and SMS require opt-in)

  // Future implementation:
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: {
  //     emailNotifications: true,
  //     whatsappOptIn: true,
  //     whatsappNumber: true,
  //     smsOptIn: true,
  //     phoneNumber: true,
  //   },
  // });

  return {
    email: true, // Always send email if user has email
    whatsapp: false, // Requires explicit opt-in + phone number
    sms: isSMSConfigured(), // Enable if Twilio is configured
    push: false,
  };
}

/**
 * Send notification to a single user
 */
export async function sendNotification(
  userId: string,
  event: NotificationEvent,
  params: NotificationParams
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    sentChannels: [],
    errors: [],
  };

  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        phone: true, // For SMS notifications
        // Future: whatsappNumber, whatsappOptIn, smsOptIn, etc.
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get user preferences
    const preferences = await getUserPreferences();

    const recipientName = user.name || "User";

    // Send email notification
    if (preferences.email && user.email) {
      try {
        await sendEmailNotification(user.email, recipientName, event, params);
        result.sentChannels.push(NotificationChannel.EMAIL);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push({ channel: NotificationChannel.EMAIL, error: errorMsg });
      }
    }

    // Send WhatsApp notification
    // if (preferences.whatsapp && user.whatsappNumber) {
    //   try {
    //     await sendWhatsAppNotification(user.whatsappNumber, recipientName, event, params);
    //     result.sentChannels.push(NotificationChannel.WHATSAPP);
    //   } catch (err) {
    //     const errorMsg = err instanceof Error ? err.message : "Unknown error";
    //     result.errors.push({ channel: NotificationChannel.WHATSAPP, error: errorMsg });
    //   }
    // }

    // Send SMS notification
    if (preferences.sms && user.phone) {
      try {
        await sendSMSNotification(user.phone, recipientName, event, params);
        result.sentChannels.push(NotificationChannel.SMS);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push({ channel: NotificationChannel.SMS, error: errorMsg });
      }
    }

    // TODO: Push notifications

    result.success = result.sentChannels.length > 0;
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`Failed to send notification to user ${userId}:`, errorMsg);
    result.errors.push({ channel: NotificationChannel.EMAIL, error: errorMsg });
    return result;
  }
}

/**
 * Send notifications to multiple users (batch)
 */
export async function sendBatchNotifications(
  userIds: string[],
  event: NotificationEvent,
  params: NotificationParams
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  // Send in batches of 50 to avoid overwhelming services
  const BATCH_SIZE = 50;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map((userId) => sendNotification(userId, event, params))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          sentChannels: [],
          errors: [{ channel: NotificationChannel.EMAIL, error: result.reason }],
        });
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(
    `Batch notification complete: ${results.filter((r) => r.success).length}/${results.length} successful`
  );

  return results;
}

/**
 * Send email notification based on event type
 */
async function sendEmailNotification(
  email: string,
  name: string,
  event: NotificationEvent,
  params: NotificationParams
): Promise<void> {
  switch (event) {
    case NotificationEvent.STREAM_SCHEDULED: {
      const p = params as StreamScheduledParams;
      await sendStreamScheduledEmail({
        recipientEmail: email,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        scheduledFor: p.scheduledFor,
        streamUrl: p.streamUrl,
      });
      break;
    }

    case NotificationEvent.STREAM_LIVE: {
      const p = params as StreamLiveParams;
      await sendStreamLiveEmail({
        recipientEmail: email,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        streamUrl: p.streamUrl,
      });
      break;
    }

    case NotificationEvent.STREAM_ENDED: {
      const p = params as StreamEndedParams;
      await sendStreamEndedEmail({
        recipientEmail: email,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        duration: p.duration,
        peakViewers: p.peakViewers,
        totalComments: p.totalComments,
      });
      break;
    }

    case NotificationEvent.RECORDING_READY: {
      const p = params as RecordingReadyParams;
      await sendRecordingReadyEmail({
        recipientEmail: email,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        recordingUrl: p.recordingUrl,
        expiresAt: p.expiresAt,
      });
      break;
    }

    case NotificationEvent.RECORDING_EXPIRING: {
      const p = params as RecordingExpiringParams;
      await sendRecordingExpiringEmail({
        recipientEmail: email,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        recordingUrl: p.recordingUrl,
        expiresAt: p.expiresAt,
        daysRemaining: p.daysRemaining,
      });
      break;
    }

    case NotificationEvent.RECORDING_DELETED: {
      const p = params as RecordingDeletedParams;
      await sendRecordingDeletedEmail({
        recipientEmail: email,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        deletedAt: p.deletedAt,
      });
      break;
    }

    default:
      throw new Error(`Unknown notification event: ${event}`);
  }
}

/**
 * Send WhatsApp notification based on event type
 * Currently unused - will be enabled when WhatsApp opt-in is implemented
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendWhatsAppNotification(
  phoneNumber: string,
  name: string,
  event: NotificationEvent,
  params: NotificationParams
): Promise<void> {
  switch (event) {
    case NotificationEvent.STREAM_SCHEDULED: {
      const p = params as StreamScheduledParams;
      await sendStreamScheduledWhatsApp({
        phoneNumber,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        scheduledFor: p.scheduledFor,
        streamUrl: p.streamUrl,
      });
      break;
    }

    case NotificationEvent.STREAM_LIVE: {
      const p = params as StreamLiveParams;
      await sendStreamLiveWhatsApp({
        phoneNumber,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        streamUrl: p.streamUrl,
      });
      break;
    }

    case NotificationEvent.STREAM_ENDED: {
      const p = params as StreamEndedParams;
      await sendStreamEndedWhatsApp({
        phoneNumber,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        duration: p.duration,
        peakViewers: p.peakViewers,
      });
      break;
    }

    case NotificationEvent.RECORDING_READY: {
      const p = params as RecordingReadyParams;
      await sendRecordingReadyWhatsApp({
        phoneNumber,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        recordingUrl: p.recordingUrl,
        expiresAt: p.expiresAt,
      });
      break;
    }

    case NotificationEvent.RECORDING_EXPIRING: {
      const p = params as RecordingExpiringParams;
      await sendRecordingExpiringWhatsApp({
        phoneNumber,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        daysRemaining: p.daysRemaining,
      });
      break;
    }

    case NotificationEvent.RECORDING_DELETED: {
      const p = params as RecordingDeletedParams;
      await sendRecordingDeletedWhatsApp({
        phoneNumber,
        recipientName: name,
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        deletedAt: p.deletedAt,
      });
      break;
    }

    default:
      throw new Error(`Unknown notification event: ${event}`);
  }
}

/**
 * Send SMS notification based on event type
 */
async function sendSMSNotification(
  phoneNumber: string,
  name: string,
  event: NotificationEvent,
  params: NotificationParams
): Promise<void> {
  switch (event) {
    case NotificationEvent.STREAM_SCHEDULED: {
      const p = params as StreamScheduledParams;
      await sendStreamScheduledSMS(phoneNumber, {
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        scheduledDate: p.scheduledFor.toLocaleDateString(),
        scheduledTime: p.scheduledFor.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        streamUrl: p.streamUrl,
      });
      break;
    }

    case NotificationEvent.STREAM_LIVE: {
      const p = params as StreamLiveParams;
      await sendStreamLiveSMS(phoneNumber, {
        memorialName: p.memorialName,
        streamTitle: p.streamTitle,
        streamUrl: p.streamUrl,
      });
      break;
    }

    case NotificationEvent.STREAM_ENDED: {
      // No SMS for stream ended - not critical enough
      console.log(`SMS not sent for STREAM_ENDED to ${phoneNumber} - event type not critical`);
      break;
    }

    case NotificationEvent.RECORDING_READY: {
      const p = params as RecordingReadyParams;
      await sendRecordingReadySMS(phoneNumber, {
        memorialName: p.memorialName,
        recordingUrl: p.recordingUrl,
        expiresAt: p.expiresAt.toLocaleDateString(),
      });
      break;
    }

    case NotificationEvent.RECORDING_EXPIRING: {
      // No SMS for recording expiring - email is sufficient
      console.log(
        `SMS not sent for RECORDING_EXPIRING to ${phoneNumber} - email notification sufficient`
      );
      break;
    }

    case NotificationEvent.RECORDING_DELETED: {
      // No SMS for recording deleted - not critical
      console.log(`SMS not sent for RECORDING_DELETED to ${phoneNumber} - event type not critical`);
      break;
    }

    default:
      throw new Error(`Unknown notification event: ${event}`);
  }
}
