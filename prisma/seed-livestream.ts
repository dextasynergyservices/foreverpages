import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function seedLivestream() {
  console.log("🎥 Seeding livestream data...");

  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: "test@foreverpages.com" },
    });

    if (!testUser) {
      console.log("Creating test user...");
      testUser = await prisma.user.create({
        data: {
          email: "test@foreverpages.com",
          name: "Test User",
          password: "$2a$10$dummyHashedPassword", // Dummy hash
          emailVerified: new Date(),
        },
      });
    }

    // Find or create a test memorial
    let testMemorial = await prisma.memorial.findFirst({
      where: { ownerId: testUser.id },
    });

    if (!testMemorial) {
      console.log("Creating test memorial...");
      testMemorial = await prisma.memorial.create({
        data: {
          slug: "test-memorial-livestream",
          ownerId: testUser.id,
          firstName: "John",
          lastName: "Doe",
          birthDate: new Date("1950-01-01"),
          deathDate: new Date("2024-01-01"),
          isPublished: true,
        },
      });
    }

    // Create sample livestreams

    // 1. Scheduled stream (upcoming)
    const scheduledStream = await prisma.memorialStream.create({
      data: {
        memorialId: testMemorial.id,
        title: "Memorial Service - John Doe",
        description:
          "Join us for a celebration of life honoring John Doe. The service will include eulogies, music, and shared memories.",
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
        status: "SCHEDULED",
        streamQuality: "FULL_HD", // 1080p
        streamType: "WEBRTC",
        recordStream: true,
        allowComments: true,
        allowAnonymous: true,
        isPublic: true,
        language: "en",
      },
    });

    console.log("✅ Created scheduled stream:", scheduledStream.id);

    // 2. Password-protected stream
    const privateStream = await prisma.memorialStream.create({
      data: {
        memorialId: testMemorial.id,
        title: "Private Family Gathering",
        description: "Intimate family memorial service. Password required to join.",
        scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: "SCHEDULED",
        streamQuality: "HD", // 720p
        streamType: "WEBRTC",
        recordStream: true,
        allowComments: true,
        allowAnonymous: false,
        isPublic: false,
        password: "family2024", // In production, this would be hashed
        language: "en",
      },
    });

    console.log("✅ Created private stream:", privateStream.id);

    // 3. Completed stream with recording
    const pastStream = await prisma.memorialStream.create({
      data: {
        memorialId: testMemorial.id,
        title: "Celebration of Life - Recorded",
        description: "Watch the recording of our memorial service.",
        scheduledFor: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 90 minutes
        actualDuration: 5400, // 90 minutes in seconds
        status: "ENDED",
        streamQuality: "FULL_HD",
        streamType: "WEBRTC",
        recordStream: true,
        recordingStatus: "READY",
        recordingUrl: "https://res.cloudinary.com/demo/video/sample.mp4", // Sample URL
        recordingDuration: 5400,
        recordingSize: 850000000, // ~850 MB
        allowComments: true,
        allowAnonymous: true,
        isPublic: true,
        peakViewers: 45,
        totalViews: 128,
        totalComments: 23,
        averageWatchTime: 3600, // 60 minutes average
        replayViews: 67,
        likeCount: 34,
        shareCount: 12,
        notificationsSent: true,
        emailsSent: 25,
        whatsappSent: 18,
        language: "en",
      },
    });

    console.log("✅ Created past stream with recording:", pastStream.id);

    // Set 6-month retention for the recording
    const recordingDeleteDate = new Date(pastStream.endedAt!);
    recordingDeleteDate.setMonth(recordingDeleteDate.getMonth() + 6);

    const recordingWarningDate = new Date(recordingDeleteDate);
    recordingWarningDate.setDate(recordingWarningDate.getDate() - 7); // 7 days before deletion

    const recording = await prisma.streamRecording.create({
      data: {
        streamId: pastStream.id,
        title: "Full Recording - Celebration of Life",
        url: "https://res.cloudinary.com/demo/video/sample.mp4",
        duration: 5400,
        fileSize: 850000000,
        format: "mp4",
        resolution: "1920x1080",
        quality: "FULL_HD",
        recordingType: "FULL",
        status: "READY",
        processedAt: pastStream.endedAt,
        deleteAt: recordingDeleteDate,
        deleteWarningAt: recordingWarningDate,
        thumbnailUrl: "https://res.cloudinary.com/demo/video/sample.jpg",
        views: 67,
        downloads: 8,
      },
    });

    console.log("✅ Created recording with 6-month retention:", recording.id);

    // Create sample viewers for the past stream
    const viewer1 = await prisma.streamViewer.create({
      data: {
        streamId: pastStream.id,
        userId: testUser.id,
        sessionId: "session-001",
        joinedAt: pastStream.startedAt!,
        leftAt: pastStream.endedAt!,
        watchTime: 5400,
        isActive: false,
        commented: true,
        reacted: true,
        shared: false,
        deviceType: "desktop",
        browser: "Chrome",
        country: "United States",
        city: "New York",
        connectionQuality: "excellent",
      },
    });

    console.log("✅ Created viewer:", viewer1.id);

    // Create sample comments
    const comment1 = await prisma.streamComment.create({
      data: {
        streamId: pastStream.id,
        userId: testUser.id,
        authorName: testUser.name || "Anonymous",
        content: "Beautiful service. John will be deeply missed. 🙏",
        timestamp: 1200, // 20 minutes into the stream
        isApproved: true,
        likeCount: 8,
      },
    });

    console.log("✅ Created comment:", comment1.id);

    // Create sample reactions
    const reaction1 = await prisma.streamReaction.create({
      data: {
        streamId: pastStream.id,
        userId: testUser.id,
        sessionId: "session-001",
        type: "HEART",
        timestamp: 1800,
      },
    });

    const reaction2 = await prisma.streamReaction.create({
      data: {
        streamId: pastStream.id,
        userId: testUser.id,
        sessionId: "session-001",
        type: "PRAYER",
        timestamp: 2400,
      },
    });

    console.log("✅ Created reactions:", reaction1.id, reaction2.id);

    // Create analytics data points
    const analyticsPoints = [
      {
        concurrentViewers: 5,
        totalViewers: 5,
        timestamp: new Date(pastStream.startedAt!.getTime() + 0),
      },
      {
        concurrentViewers: 15,
        totalViewers: 18,
        timestamp: new Date(pastStream.startedAt!.getTime() + 600000),
      }, // 10 min
      {
        concurrentViewers: 32,
        totalViewers: 45,
        timestamp: new Date(pastStream.startedAt!.getTime() + 1200000),
      }, // 20 min
      {
        concurrentViewers: 45,
        totalViewers: 78,
        timestamp: new Date(pastStream.startedAt!.getTime() + 1800000),
      }, // 30 min (peak)
      {
        concurrentViewers: 38,
        totalViewers: 95,
        timestamp: new Date(pastStream.startedAt!.getTime() + 2400000),
      }, // 40 min
      {
        concurrentViewers: 28,
        totalViewers: 110,
        timestamp: new Date(pastStream.startedAt!.getTime() + 3600000),
      }, // 60 min
      {
        concurrentViewers: 20,
        totalViewers: 120,
        timestamp: new Date(pastStream.startedAt!.getTime() + 4800000),
      }, // 80 min
      {
        concurrentViewers: 12,
        totalViewers: 128,
        timestamp: new Date(pastStream.startedAt!.getTime() + 5400000),
      }, // 90 min (end)
    ];

    for (const point of analyticsPoints) {
      await prisma.streamAnalytics.create({
        data: {
          streamId: pastStream.id,
          ...point,
          commentsCount: Math.floor(Math.random() * 5),
          reactionsCount: Math.floor(Math.random() * 10),
        },
      });
    }

    console.log("✅ Created analytics data points");

    // 4. Live stream (currently streaming)
    const liveStream = await prisma.memorialStream.create({
      data: {
        memorialId: testMemorial.id,
        title: "LIVE: Memorial Gathering",
        description: "Join us now for our live memorial service.",
        scheduledFor: new Date(Date.now() - 30 * 60 * 1000), // Started 30 min ago
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        status: "LIVE",
        streamQuality: "FULL_HD",
        streamType: "WEBRTC",
        recordStream: true,
        recordingStatus: "RECORDING",
        allowComments: true,
        allowAnonymous: true,
        isPublic: true,
        peakViewers: 23,
        totalViews: 45,
        totalComments: 8,
        language: "en",
      },
    });

    console.log("✅ Created live stream:", liveStream.id);

    // Create active viewers for live stream
    for (let i = 1; i <= 23; i++) {
      await prisma.streamViewer.create({
        data: {
          streamId: liveStream.id,
          sessionId: `live-session-${i}`,
          guestName: `Viewer ${i}`,
          joinedAt: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
          watchTime: Math.floor(Math.random() * 1800),
          isActive: true,
          deviceType: ["mobile", "desktop", "tablet"][Math.floor(Math.random() * 3)],
          browser: ["Chrome", "Safari", "Firefox", "Edge"][Math.floor(Math.random() * 4)],
          connectionQuality: ["good", "excellent"][Math.floor(Math.random() * 2)],
        },
      });
    }

    console.log("✅ Created 23 active viewers for live stream");

    console.log("\n🎉 Livestream seed data created successfully!");
    console.log("\n📊 Summary:");
    console.log("- 1 Scheduled stream (upcoming)");
    console.log("- 1 Private password-protected stream");
    console.log("- 1 Completed stream with recording");
    console.log("- 1 Currently LIVE stream");
    console.log("- Sample viewers, comments, reactions, and analytics");
    console.log("\n💡 Quality Presets Available:");
    console.log("- LOWEST (144p)");
    console.log("- LOW (240p)");
    console.log("- MEDIUM (360p)");
    console.log("- SD (480p)");
    console.log("- HD (720p)");
    console.log("- FULL_HD (1080p) ⭐ Default");
    console.log("\n🔒 Privacy Options:");
    console.log("- Open to all (isPublic: true, password: null)");
    console.log("- Password protected (isPublic: false, password: set)");
    console.log("\n📅 Recording Retention:");
    console.log("- Auto-delete after 6 months");
    console.log("- Warning sent 7 days before deletion");
  } catch (error) {
    console.error("❌ Error seeding livestream data:", error);
    throw error;
  }
}

async function main() {
  try {
    await seedLivestream();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
