import { PrismaClient, NotificationType } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🔔 Starting admin notification seeding...");

  // Find the admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      email: "admin@foreverpages.online",
      role: "ADMIN",
    },
  });

  if (!adminUser) {
    console.log("❌ No admin user found. Please run: npx tsx prisma/seed-admin.ts");
    process.exit(1);
  }

  console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})`);

  // Clear existing notifications for admin
  await prisma.notification.deleteMany({
    where: { userId: adminUser.id },
  });
  console.log("🗑️  Cleared existing admin notifications");

  // Helper to create notifications with varying timestamps
  const now = new Date();
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Create admin-specific notifications
  const notifications = [
    // 1. NEW_TRIBUTE - Recent & Unread (someone posted tribute on a memorial)
    {
      type: NotificationType.NEW_TRIBUTE,
      title: "New Tribute Posted",
      message: "John Smith shared a tribute on the memorial page for Mary Johnson.",
      link: "/admin/memorial-pages",
      isRead: false,
      createdAt: hoursAgo(2),
      userId: adminUser.id,
    },
    // 2. SYSTEM - New User Registration
    {
      type: NotificationType.SYSTEM,
      title: "New User Registration",
      message: "A new user (sarah.wilson@email.com) has registered on the platform.",
      link: "/admin/users",
      isRead: false,
      createdAt: hoursAgo(4),
      userId: adminUser.id,
    },
    // 3. SYSTEM - Payment Received
    {
      type: NotificationType.SYSTEM,
      title: "Payment Received",
      message: "Payment of ₦120,000 received for Darling Plan by David Thompson.",
      link: "/admin/payments",
      isRead: false,
      createdAt: hoursAgo(6),
      userId: adminUser.id,
    },
    // 4. EXPIRING_SOON - Memorial Expiring (Admin notification)
    {
      type: NotificationType.EXPIRING_SOON,
      title: "Memorial Expiring Soon",
      message: "Memorial page for Robert Davis will expire in 3 days. User may need reminder.",
      link: "/admin/memorial-pages",
      isRead: false,
      createdAt: hoursAgo(8),
      userId: adminUser.id,
    },
    // 5. SYSTEM - Subscription Renewal
    {
      type: NotificationType.SYSTEM,
      title: "Subscription Renewed",
      message: "Jennifer Martinez renewed their Delight Plan subscription.",
      link: "/admin/subscriptions",
      isRead: false,
      createdAt: hoursAgo(12),
      userId: adminUser.id,
    },
    // 6. NEW_PHOTO - Recent & Unread
    {
      type: NotificationType.NEW_PHOTO,
      title: "Photos Uploaded",
      message: "Lisa Anderson uploaded 8 photos to their memorial gallery.",
      link: "/admin/memorial-pages",
      isRead: false,
      createdAt: hoursAgo(18),
      userId: adminUser.id,
    },
    // 7. SYSTEM - Failed Payment
    {
      type: NotificationType.SYSTEM,
      title: "Failed Payment Attempt",
      message: "Payment failed for user michael.brown@email.com. Subscription may expire.",
      link: "/admin/payments",
      isRead: false,
      createdAt: hoursAgo(24),
      userId: adminUser.id,
    },
    // 8. SYSTEM - Support Request
    {
      type: NotificationType.SYSTEM,
      title: "New Support Request",
      message: "User needs help with memorial page customization. Priority: High",
      link: "/admin/support",
      isRead: false,
      createdAt: daysAgo(1),
      userId: adminUser.id,
    },
    // 9. INVITATION - Admin was added as contributor (example)
    {
      type: NotificationType.INVITATION,
      title: "Added as Memorial Admin",
      message: "You were added as an admin to help manage a memorial page.",
      link: "/admin/memorial-pages",
      isRead: true,
      readAt: daysAgo(2),
      createdAt: daysAgo(3),
      userId: adminUser.id,
    },
    // 10. SYSTEM - Platform Stats
    {
      type: NotificationType.SYSTEM,
      title: "Weekly Platform Report",
      message: "Platform stats: 25 new users, 15 new memorials, ₦450,000 revenue this week.",
      link: "/admin/analytics",
      isRead: true,
      readAt: daysAgo(4),
      createdAt: daysAgo(7),
      userId: adminUser.id,
    },
    // 11. NEW_COMMENT - Recent & Unread
    {
      type: NotificationType.NEW_COMMENT,
      title: "New Comment",
      message: "User commented on a tribute: 'Beautiful memories shared.'",
      link: "/admin/memorial-pages",
      isRead: false,
      createdAt: hoursAgo(3),
      userId: adminUser.id,
    },
    // 12. SYSTEM - Account Verification
    {
      type: NotificationType.SYSTEM,
      title: "Pending Email Verifications",
      message: "5 users have not verified their email addresses in 48+ hours.",
      link: "/admin/users",
      isRead: false,
      createdAt: hoursAgo(15),
      userId: adminUser.id,
    },
    // 13. MEMORIAL_ANNIVERSARY - Reminder
    {
      type: NotificationType.MEMORIAL_ANNIVERSARY,
      title: "Memorial Anniversary Today",
      message: "Today marks the 1-year anniversary for 3 memorial pages.",
      link: "/admin/memorial-pages",
      isRead: true,
      readAt: hoursAgo(30),
      createdAt: daysAgo(2),
      userId: adminUser.id,
    },
    // 14. SYSTEM - Storage Alert
    {
      type: NotificationType.SYSTEM,
      title: "Storage Alert",
      message: "User account approaching storage limit: 480MB of 500MB used.",
      link: "/admin/users",
      isRead: false,
      createdAt: hoursAgo(20),
      userId: adminUser.id,
    },
    // 15. SYSTEM - Recent Activity
    {
      type: NotificationType.SYSTEM,
      title: "High Activity Detected",
      message: "Unusual spike in traffic: 500+ visitors in the last hour.",
      link: "/admin/analytics",
      isRead: false,
      createdAt: hoursAgo(1),
      userId: adminUser.id,
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

  console.log(`✅ Created ${created} admin notifications`);

  // Summary statistics
  const stats = await prisma.notification.groupBy({
    by: ["type", "isRead"],
    where: { userId: adminUser.id },
    _count: true,
  });

  console.log("\n📊 Admin Notification Statistics:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  stats.forEach((stat) => {
    console.log(
      `  ${stat.type.padEnd(25)} | ${stat.isRead ? "Read  " : "Unread"} | Count: ${stat._count}`
    );
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: adminUser.id, isRead: false },
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`\n🔔 Total Unread Notifications: ${unreadCount}`);
  console.log(`📧 Total Notifications: ${created}`);
  console.log("\n✨ Admin notification seeding completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("   1. Login with admin@foreverpages.online / Admin@2024");
  console.log("   2. Go to /admin dashboard");
  console.log("   3. Check the notification bell in the header");
  console.log("   4. Test mark as read, clear all functionality");
  console.log("   5. Test email digest: GET /api/notifications/digest?period=daily");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin notifications:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
