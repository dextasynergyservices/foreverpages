import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */
export class NotificationService {
  /**
   * Create a single notification
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link || null,
        },
      });

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Create multiple notifications (bulk)
   */
  static async createBulkNotifications(notifications: CreateNotificationParams[]) {
    try {
      const result = await prisma.notification.createMany({
        data: notifications.map((n) => ({
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link || null,
        })),
      });

      return result;
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw error;
    }
  }

  /**
   * Notify when a new tribute is posted
   */
  static async notifyNewTribute(
    memorialOwnerId: string,
    tributeAuthorName: string,
    memorialSlug: string
  ) {
    return this.createNotification({
      userId: memorialOwnerId,
      type: "NEW_TRIBUTE",
      title: "New Tribute Posted",
      message: `${tributeAuthorName} posted a new tribute on your memorial page`,
      link: `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Notify when a new comment is posted
   */
  static async notifyNewComment(
    userId: string,
    commenterName: string,
    memorialSlug: string,
    postId?: string
  ) {
    return this.createNotification({
      userId,
      type: "NEW_COMMENT",
      title: "New Comment",
      message: `${commenterName} commented on your memorial page`,
      link: postId
        ? `/memorial-pages/${memorialSlug}?post=${postId}`
        : `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Notify when a new photo is uploaded
   */
  static async notifyNewPhoto(userId: string, uploaderName: string, memorialSlug: string) {
    return this.createNotification({
      userId,
      type: "NEW_PHOTO",
      title: "New Photo Added",
      message: `${uploaderName} added new photos to your memorial page`,
      link: `/memorial-pages/${memorialSlug}/gallery`,
    });
  }

  /**
   * Notify when a virtual candle is lit
   */
  static async notifyNewCandle(userId: string, senderName: string, memorialSlug: string) {
    return this.createNotification({
      userId,
      type: "NEW_CANDLE",
      title: "Virtual Candle Lit",
      message: `${senderName} lit a virtual candle in memory`,
      link: `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Notify when a virtual flower is sent
   */
  static async notifyNewFlower(userId: string, senderName: string, memorialSlug: string) {
    return this.createNotification({
      userId,
      type: "NEW_FLOWER",
      title: "Virtual Flower Sent",
      message: `${senderName} sent virtual flowers in memory`,
      link: `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Notify about memorial anniversary
   */
  static async notifyMemorialAnniversary(
    userId: string,
    deceasedName: string,
    years: number,
    memorialSlug: string
  ) {
    return this.createNotification({
      userId,
      type: "MEMORIAL_ANNIVERSARY",
      title: "Memorial Anniversary",
      message: `Today marks ${years} ${years === 1 ? "year" : "years"} since ${deceasedName} passed away`,
      link: `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Notify about birthday anniversary
   */
  static async notifyBirthdayAnniversary(
    userId: string,
    deceasedName: string,
    memorialSlug: string
  ) {
    return this.createNotification({
      userId,
      type: "BIRTHDAY_ANNIVERSARY",
      title: "Birthday Remembrance",
      message: `Today would have been ${deceasedName}'s birthday`,
      link: `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Notify when memorial is expiring soon
   */
  static async notifyExpiringMemorial(userId: string, memorialSlug: string, daysRemaining: number) {
    return this.createNotification({
      userId,
      type: "EXPIRING_SOON",
      title: "Memorial Expiring Soon",
      message: `Your memorial page will expire in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}. Renew now to keep it active.`,
      link: `/user-dashboard?section=settings`,
    });
  }

  /**
   * Notify when invitation is sent
   */
  static async notifyInvitation(userId: string, inviterName: string, memorialSlug: string) {
    return this.createNotification({
      userId,
      type: "INVITATION",
      title: "Memorial Invitation",
      message: `${inviterName} invited you to collaborate on a memorial page`,
      link: `/memorial-pages/${memorialSlug}`,
    });
  }

  /**
   * Send system notification
   */
  static async notifySystem(userId: string, title: string, message: string, link?: string) {
    return this.createNotification({
      userId,
      type: "SYSTEM",
      title,
      message,
      link,
    });
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      return await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw error;
    }
  }

  /**
   * Delete old read notifications (cleanup)
   */
  static async cleanupOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      return await prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: {
            lt: cutoffDate,
          },
        },
      });
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }
}

export default NotificationService;
