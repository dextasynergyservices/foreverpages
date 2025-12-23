/**
 * Utility functions for generating specific notification links
 * Ensures consistent navigation to exact content locations
 */

export interface NotificationLinkOptions {
  memorialSlug: string;
  tributeId?: string;
  commentId?: string;
  postId?: string;
  photoId?: string;
  candleId?: string;
  flowerId?: string;
  sectionId?: string;
}

/**
 * Generate link for tribute notifications
 */
export function generateTributeLink(options: NotificationLinkOptions): string {
  const { memorialSlug, tributeId, sectionId } = options;

  if (tributeId) {
    return `/${memorialSlug}#tribute-${tributeId}`;
  }

  if (sectionId) {
    return `/${memorialSlug}#${sectionId}`;
  }

  return `/${memorialSlug}#tributes-section`;
}

/**
 * Generate link for comment notifications
 */
export function generateCommentLink(options: NotificationLinkOptions): string {
  const { memorialSlug, commentId, postId } = options;

  if (commentId) {
    return `/${memorialSlug}#comment-${commentId}`;
  }

  if (postId) {
    return `/${memorialSlug}#post-${postId}`;
  }

  return `/${memorialSlug}#comments-section`;
}

/**
 * Generate link for photo notifications
 */
export function generatePhotoLink(options: NotificationLinkOptions): string {
  const { memorialSlug, photoId } = options;

  if (photoId) {
    return `/${memorialSlug}#photo-${photoId}`;
  }

  return `/${memorialSlug}#gallery-section`;
}

/**
 * Generate link for candle notifications
 */
export function generateCandleLink(options: NotificationLinkOptions): string {
  const { memorialSlug, candleId } = options;

  if (candleId) {
    return `/${memorialSlug}#candle-${candleId}`;
  }

  return `/${memorialSlug}#candles-section`;
}

/**
 * Generate link for flower notifications
 */
export function generateFlowerLink(options: NotificationLinkOptions): string {
  const { memorialSlug, flowerId } = options;

  if (flowerId) {
    return `/${memorialSlug}#flower-${flowerId}`;
  }

  return `/${memorialSlug}#flowers-section`;
}

/**
 * Generate link for memorial anniversary notifications
 */
export function generateAnniversaryLink(
  memorialSlug: string,
  type: "memorial" | "birthday" = "memorial"
): string {
  const anchor = type === "birthday" ? "birthday-memories" : "anniversary-tribute";
  return `/${memorialSlug}#${anchor}`;
}

/**
 * Generate link for dashboard notifications
 */
export function generateDashboardLink(section: string, highlight?: string, tab?: string): string {
  let link = `/user-dashboard?section=${section}`;

  if (highlight) {
    link += `&highlight=${highlight}`;
  }

  if (tab) {
    link += `&tab=${tab}`;
  }

  return link;
}

/**
 * Generate link for expiring memorial notifications
 */
export function generateSubscriptionLink(): string {
  return generateDashboardLink("subscription");
}

/**
 * Main function to generate notification links based on type
 */
export function generateNotificationLink(
  type: string,
  memorialSlug: string,
  options: Partial<NotificationLinkOptions> = {}
): string {
  const linkOptions: NotificationLinkOptions = {
    memorialSlug,
    ...options,
  };

  switch (type) {
    case "NEW_TRIBUTE":
      return generateTributeLink(linkOptions);

    case "NEW_COMMENT":
      return generateCommentLink(linkOptions);

    case "NEW_PHOTO":
      return generatePhotoLink(linkOptions);

    case "NEW_CANDLE":
      return generateCandleLink(linkOptions);

    case "NEW_FLOWER":
      return generateFlowerLink(linkOptions);

    case "MEMORIAL_ANNIVERSARY":
      return generateAnniversaryLink(memorialSlug, "memorial");

    case "BIRTHDAY_ANNIVERSARY":
      return generateAnniversaryLink(memorialSlug, "birthday");

    case "INVITATION":
      return generateDashboardLink("invitations", options.tributeId); // reuse tributeId as invitationId

    case "EXPIRING_SOON":
      return generateSubscriptionLink();

    case "SYSTEM":
      // System notifications can vary, default to main memorial page
      return `/${memorialSlug}`;

    default:
      return `/${memorialSlug}`;
  }
}
