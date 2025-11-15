import { PrismaClient, NotificationType } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🔔 Starting notification seeding...");

  // Find or create a test user
  const user = await prisma.user.findFirst({
    where: { email: "eeyuren1@gmail.com" },
  });

  if (!user) {
    console.log("❌ No test user found. Please run the main seed file first or create a user.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email} (${user.id})`);

  // Clear existing notifications for this user
  await prisma.notification.deleteMany({
    where: { userId: user.id },
  });
  console.log("🗑️  Cleared existing notifications");

  // Helper to create notifications with varying timestamps
  const now = new Date();
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Create notifications for all 10 types with varying states
  const notifications = [
    // 1. NEW_TRIBUTE - Recent & Unread
    {
      type: NotificationType.NEW_TRIBUTE,
      title: "New Tribute Added",
      message: "Sarah Johnson shared a heartfelt tribute on John's memorial page.",
      link: "/memorial-pages/mem_123/tributes",
      isRead: false,
      createdAt: hoursAgo(1),
      userId: user.id,
    },
    // 2. NEW_TRIBUTE - Older & Read
    {
      type: NotificationType.NEW_TRIBUTE,
      title: "New Tribute Added",
      message: "Michael Brown wrote a beautiful memory about your loved one.",
      link: "/memorial-pages/mem_123/tributes",
      isRead: true,
      readAt: hoursAgo(25),
      createdAt: daysAgo(2),
      userId: user.id,
    },
    // 3. NEW_COMMENT - Recent & Unread
    {
      type: NotificationType.NEW_COMMENT,
      title: "New Comment",
      message: "Emily Davis commented: 'Such beautiful memories. Thinking of you all.'",
      link: "/memorial-pages/mem_123/tributes/trib_456",
      isRead: false,
      createdAt: hoursAgo(3),
      userId: user.id,
    },
    // 4. NEW_PHOTO - Recent & Unread
    {
      type: NotificationType.NEW_PHOTO,
      title: "New Photo Added",
      message: "David Wilson added 5 photos to the memorial gallery.",
      link: "/memorial-pages/mem_123/gallery",
      isRead: false,
      createdAt: hoursAgo(5),
      userId: user.id,
    },
    // 5. NEW_CANDLE - Recent & Unread
    {
      type: NotificationType.NEW_CANDLE,
      title: "Candle Lit",
      message: "Lisa Anderson lit a candle in memory of your loved one.",
      link: "/memorial-pages/mem_123",
      isRead: false,
      createdAt: hoursAgo(8),
      userId: user.id,
    },
    // 6. NEW_FLOWER - Read
    {
      type: NotificationType.NEW_FLOWER,
      title: "Flowers Sent",
      message: "Robert Taylor sent virtual flowers to the memorial.",
      link: "/memorial-pages/mem_123",
      isRead: true,
      readAt: daysAgo(1),
      createdAt: daysAgo(1),
      userId: user.id,
    },
    // 7. INVITATION - Recent & Unread (High Priority)
    {
      type: NotificationType.INVITATION,
      title: "Memorial Invitation",
      message: "You've been invited to collaborate on Mary's memorial page.",
      link: "/user-dashboard?section=invitations",
      isRead: false,
      createdAt: hoursAgo(2),
      userId: user.id,
    },
    // 8. MEMORIAL_ANNIVERSARY - Recent & Unread (Important)
    {
      type: NotificationType.MEMORIAL_ANNIVERSARY,
      title: "Anniversary Reminder",
      message: "Today marks 1 year since John passed away. Take a moment to remember.",
      link: "/memorial-pages/mem_123",
      isRead: false,
      createdAt: hoursAgo(6),
      userId: user.id,
    },
    // 9. BIRTHDAY_ANNIVERSARY - Older & Read
    {
      type: NotificationType.BIRTHDAY_ANNIVERSARY,
      title: "Birthday Remembrance",
      message: "Today would have been John's 65th birthday. Share your favorite memories.",
      link: "/memorial-pages/mem_123",
      isRead: true,
      readAt: daysAgo(3),
      createdAt: daysAgo(3),
      userId: user.id,
    },
    // 10. EXPIRING_SOON - Recent & Unread (Urgent)
    {
      type: NotificationType.EXPIRING_SOON,
      title: "Subscription Expiring Soon",
      message:
        "Your memorial page subscription will expire in 7 days. Renew now to keep it active.",
      link: "/user-dashboard?section=manage-subscription",
      isRead: false,
      createdAt: hoursAgo(12),
      userId: user.id,
    },
    // 11. SYSTEM - Recent & Unread
    {
      type: NotificationType.SYSTEM,
      title: "New Feature Available",
      message: "Check out our new photo editing tools in the gallery section!",
      link: "/memorial-pages/mem_123/gallery",
      isRead: false,
      createdAt: hoursAgo(24),
      userId: user.id,
    },
    // 12. Additional NEW_COMMENT - for testing multiple unread
    {
      type: NotificationType.NEW_COMMENT,
      title: "New Comment",
      message: "Jennifer Lee replied to your tribute.",
      link: "/memorial-pages/mem_123/tributes/trib_789",
      isRead: false,
      createdAt: hoursAgo(4),
      userId: user.id,
    },
    // 13. Additional NEW_PHOTO - for testing grouping
    {
      type: NotificationType.NEW_PHOTO,
      title: "New Photo Added",
      message: "Mark Thompson shared a photo from the memorial service.",
      link: "/memorial-pages/mem_123/gallery",
      isRead: false,
      createdAt: hoursAgo(7),
      userId: user.id,
    },
    // 14. Week-old notification for weekly digest testing
    {
      type: NotificationType.NEW_TRIBUTE,
      title: "New Tribute Added",
      message: "Patricia Martinez shared a tribute about cherished moments.",
      link: "/memorial-pages/mem_123/tributes",
      isRead: false,
      createdAt: daysAgo(5),
      userId: user.id,
    },
    // 15. Another system notification
    {
      type: NotificationType.SYSTEM,
      title: "Account Security",
      message: "We've added two-factor authentication for enhanced security.",
      link: "/user-dashboard?section=settings",
      isRead: true,
      readAt: daysAgo(7),
      createdAt: daysAgo(8),
      userId: user.id,
    },
  ];

  // Create all notifications
  let created = 0;
  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification,
    });
    created++;
  }

  console.log(`✅ Created ${created} notifications`);

  // Summary statistics
  const stats = await prisma.notification.groupBy({
    by: ["type", "isRead"],
    where: { userId: user.id },
    _count: true,
  });

  console.log("\n📊 Notification Statistics:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  stats.forEach((stat) => {
    console.log(
      `  ${stat.type.padEnd(25)} | ${stat.isRead ? "Read  " : "Unread"} | Count: ${stat._count}`
    );
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n🔔 Total Unread Notifications: ${unreadCount}`);
  console.log(`📧 Total Notifications: ${created}`);
  console.log("\n✨ Notification seeding completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("   1. Login with test@example.com");
  console.log("   2. Check the notification bell in the dashboard");
  console.log("   3. Test mark as read, clear all functionality");
  console.log("   4. Test email digest: GET /api/notifications/digest?period=daily");
  console.log("   5. Create new notifications via the UI to test toast notifications");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding notifications:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
