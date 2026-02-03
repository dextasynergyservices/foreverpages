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
  // Granular preferences for event types
  emailTributes: boolean;
  emailComments: boolean;
  emailLivestream: boolean;
  emailAnniversary: boolean;
  emailDigest: boolean;
  smsTributes: boolean;
  smsLivestream: boolean;
  smsAnniversary: boolean;
  whatsappTributes: boolean;
  whatsappLivestream: boolean;
  whatsappAnniversary: boolean;
}

/**
 * Get user notification preferences from database
 */
async function getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notificationsEnabled: true,
      // Email
      emailNotifications: true,
      emailTributes: true,
      emailComments: true,
      emailLivestream: true,
      emailAnniversary: true,
      emailDigest: true,
      // SMS
      smsNotifications: true,
      smsTributes: true,
      smsLivestream: true,
      smsAnniversary: true,
      phone: true,
      // WhatsApp
      whatsappNotifications: true,
      whatsappNumber: true,
      whatsappTributes: true,
      whatsappLivestream: true,
      whatsappAnniversary: true,
    },
  });

  // If user not found or notifications globally disabled, return all false
  if (!user || !user.notificationsEnabled) {
    return {
      email: false,
      whatsapp: false,
      sms: false,
      push: false,
      emailTributes: false,
      emailComments: false,
      emailLivestream: false,
      emailAnniversary: false,
      emailDigest: false,
      smsTributes: false,
      smsLivestream: false,
      smsAnniversary: false,
      whatsappTributes: false,
      whatsappLivestream: false,
      whatsappAnniversary: false,
    };
  }

  return {
    // Channel-level preferences
    email: user.emailNotifications,
    sms: user.smsNotifications && !!user.phone && isSMSConfigured(),
    whatsapp: user.whatsappNotifications && !!user.whatsappNumber,
    push: false, // Push uses separate PushSubscription model

    // Granular email preferences
    emailTributes: user.emailNotifications && user.emailTributes,
    emailComments: user.emailNotifications && user.emailComments,
    emailLivestream: user.emailNotifications && user.emailLivestream,
    emailAnniversary: user.emailNotifications && user.emailAnniversary,
    emailDigest: user.emailNotifications && user.emailDigest,

    // Granular SMS preferences
    smsTributes: user.smsNotifications && user.smsTributes && !!user.phone,
    smsLivestream: user.smsNotifications && user.smsLivestream && !!user.phone,
    smsAnniversary: user.smsNotifications && user.smsAnniversary && !!user.phone,

    // Granular WhatsApp preferences
    whatsappTributes: user.whatsappNotifications && user.whatsappTributes && !!user.whatsappNumber,
    whatsappLivestream:
      user.whatsappNotifications && user.whatsappLivestream && !!user.whatsappNumber,
    whatsappAnniversary:
      user.whatsappNotifications && user.whatsappAnniversary && !!user.whatsappNumber,
  };
}

/**
 * Determine if a notification event should be sent to a specific channel
 * based on user's granular preferences
 */
function shouldSendToChannel(
  preferences: UserNotificationPreferences,
  event: NotificationEvent,
  channel: "email" | "sms" | "whatsapp"
): boolean {
  // Check channel-level preference first
  if (!preferences[channel]) return false;

  // Map events to preference categories
  switch (event) {
    case NotificationEvent.STREAM_SCHEDULED:
    case NotificationEvent.STREAM_LIVE:
    case NotificationEvent.STREAM_ENDED:
    case NotificationEvent.RECORDING_READY:
    case NotificationEvent.RECORDING_EXPIRING:
    case NotificationEvent.RECORDING_DELETED:
      // Livestream-related events
      if (channel === "email") return preferences.emailLivestream;
      if (channel === "sms") return preferences.smsLivestream;
      if (channel === "whatsapp") return preferences.whatsappLivestream;
      break;
    // Add more cases as new event types are added:
    // case NotificationEvent.NEW_TRIBUTE:
    //   if (channel === "email") return preferences.emailTributes;
    //   ...
  }

  // Default to channel preference for unmapped events
  return preferences[channel];
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
    // Get user info including WhatsApp number
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        phone: true,
        whatsappNumber: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get user preferences from database
    const preferences = await getUserPreferences(userId);

    const recipientName = user.name || "User";

    // Determine if this event type should be sent based on granular preferences
    const shouldSendEmail = shouldSendToChannel(preferences, event, "email");
    const shouldSendSMS = shouldSendToChannel(preferences, event, "sms");
    const shouldSendWhatsApp = shouldSendToChannel(preferences, event, "whatsapp");

    // Send email notification
    if (shouldSendEmail && user.email) {
      try {
        await sendEmailNotification(user.email, recipientName, event, params);
        result.sentChannels.push(NotificationChannel.EMAIL);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push({ channel: NotificationChannel.EMAIL, error: errorMsg });
      }
    }

    // Send WhatsApp notification
    if (shouldSendWhatsApp && user.whatsappNumber) {
      try {
        await sendWhatsAppNotification(user.whatsappNumber, recipientName, event, params);
        result.sentChannels.push(NotificationChannel.WHATSAPP);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push({ channel: NotificationChannel.WHATSAPP, error: errorMsg });
      }
    }

    // Send SMS notification
    if (shouldSendSMS && user.phone) {
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

/**
 * Notify all stream subscribers (memorial invitees with ACCEPTED status)
 * about stream events. This sends to all users who have accepted invitations
 * to the memorial.
 */
export async function notifyStreamSubscribers(
  streamId: string,
  event: NotificationEvent,
  additionalParams?: Partial<NotificationParams>
): Promise<{ sent: number; failed: number; total: number }> {
  try {
    // Get stream with memorial info
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    });

    if (!stream) {
      console.error(`[notifyStreamSubscribers] Stream ${streamId} not found`);
      return { sent: 0, failed: 0, total: 0 };
    }

    const memorialName = `${stream.memorial.firstName} ${stream.memorial.lastName}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const streamUrl = `${baseUrl}/${stream.memorial.slug}?stream=${streamId}`;

    // Build notification params based on event type
    let params: NotificationParams;
    switch (event) {
      case NotificationEvent.STREAM_SCHEDULED:
        params = {
          memorialName,
          streamTitle: stream.title,
          streamUrl,
          scheduledFor: stream.scheduledFor || new Date(),
          ...additionalParams,
        } as StreamScheduledParams;
        break;

      case NotificationEvent.STREAM_LIVE:
        params = {
          memorialName,
          streamTitle: stream.title,
          streamUrl,
          ...additionalParams,
        } as StreamLiveParams;
        break;

      case NotificationEvent.STREAM_ENDED:
        params = {
          memorialName,
          streamTitle: stream.title,
          duration: additionalParams?.duration || "Unknown",
          peakViewers: additionalParams?.peakViewers || 0,
          totalComments: additionalParams?.totalComments || 0,
          ...additionalParams,
        } as StreamEndedParams;
        break;

      case NotificationEvent.RECORDING_READY:
        params = {
          memorialName,
          streamTitle: stream.title,
          recordingUrl: stream.recordingUrl || streamUrl,
          expiresAt: stream.recordingDeleteAt || new Date(),
          ...additionalParams,
        } as RecordingReadyParams;
        break;

      case NotificationEvent.RECORDING_EXPIRING:
        params = {
          memorialName,
          streamTitle: stream.title,
          recordingUrl: stream.recordingUrl || streamUrl,
          expiresAt: stream.recordingDeleteAt || new Date(),
          daysRemaining: additionalParams?.daysRemaining || 7,
          ...additionalParams,
        } as RecordingExpiringParams;
        break;

      case NotificationEvent.RECORDING_DELETED:
        params = {
          memorialName,
          streamTitle: stream.title,
          deletedAt: new Date(),
          ...additionalParams,
        } as RecordingDeletedParams;
        break;

      default:
        console.error(`[notifyStreamSubscribers] Unknown event type: ${event}`);
        return { sent: 0, failed: 0, total: 0 };
    }

    // Get all users to notify:
    // 1. Memorial owner
    // 2. Users who accepted invitations to this memorial
    const acceptedInvitations = await prisma.invitation.findMany({
      where: {
        memorialId: stream.memorial.id,
        status: "ACCEPTED",
        invitedUserId: { not: null },
      },
      select: { invitedUserId: true },
    });

    const subscriberUserIds = new Set<string>();

    // Add memorial owner
    subscriberUserIds.add(stream.memorial.ownerId);

    // Add accepted invitation users
    for (const inv of acceptedInvitations) {
      if (inv.invitedUserId) {
        subscriberUserIds.add(inv.invitedUserId);
      }
    }

    const userIds = Array.from(subscriberUserIds);
    console.log(`[notifyStreamSubscribers] Notifying ${userIds.length} subscribers for ${event}`);

    // Send notifications in batch
    const results = await sendBatchNotifications(userIds, event, params);

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[notifyStreamSubscribers] ${event} complete: ${sent} sent, ${failed} failed, ${userIds.length} total`
    );

    return { sent, failed, total: userIds.length };
  } catch (error) {
    console.error("[notifyStreamSubscribers] Error:", error);
    return { sent: 0, failed: 0, total: 0 };
  }
}

/**
 * Send stream reminder notifications
 * Called by cron job or scheduled task
 */
export async function sendStreamReminders(streamId: string): Promise<{
  sent: number;
  failed: number;
}> {
  try {
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    });

    if (!stream || !stream.scheduledFor) {
      console.error(`[sendStreamReminders] Stream ${streamId} not found or not scheduled`);
      return { sent: 0, failed: 0 };
    }

    // Don't send reminders if stream already started or ended
    if (stream.status !== "SCHEDULED") {
      console.log(`[sendStreamReminders] Stream ${streamId} is not scheduled, skipping reminders`);
      return { sent: 0, failed: 0 };
    }

    // Don't send reminder if already sent
    if (stream.reminderSent) {
      console.log(`[sendStreamReminders] Reminder already sent for stream ${streamId}`);
      return { sent: 0, failed: 0 };
    }

    const result = await notifyStreamSubscribers(streamId, NotificationEvent.STREAM_SCHEDULED);

    // Mark reminder as sent
    await prisma.memorialStream.update({
      where: { id: streamId },
      data: { reminderSent: true },
    });

    return { sent: result.sent, failed: result.failed };
  } catch (error) {
    console.error("[sendStreamReminders] Error:", error);
    return { sent: 0, failed: 0 };
  }
}

// Type definitions for additionalParams
interface StreamScheduledParams {
  memorialName: string;
  streamTitle: string;
  streamUrl: string;
  scheduledFor: Date;
}

interface StreamLiveParams {
  memorialName: string;
  streamTitle: string;
  streamUrl: string;
}

interface StreamEndedParams {
  memorialName: string;
  streamTitle: string;
  duration: string;
  peakViewers: number;
  totalComments: number;
}

interface RecordingReadyParams {
  memorialName: string;
  streamTitle: string;
  recordingUrl: string;
  expiresAt: Date;
}

interface RecordingExpiringParams {
  memorialName: string;
  streamTitle: string;
  recordingUrl: string;
  expiresAt: Date;
  daysRemaining: number;
}

interface RecordingDeletedParams {
  memorialName: string;
  streamTitle: string;
  deletedAt: Date;
}

type NotificationParams =
  | StreamScheduledParams
  | StreamLiveParams
  | StreamEndedParams
  | RecordingReadyParams
  | RecordingExpiringParams
  | RecordingDeletedParams;
