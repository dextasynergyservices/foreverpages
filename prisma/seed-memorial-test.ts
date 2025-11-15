import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting memorial test data seeding...\n");

  // ============================================
  // 1. VERIFY USER EXISTS
  // ============================================
  const userId = "cmhqer9xn000f18ucvgbtvi9j";

  console.log(`📋 Checking if user ${userId} exists...`);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
    },
  });

  if (!user) {
    throw new Error(`❌ User with ID ${userId} not found! Please create the user first.`);
  }

  console.log(`✅ User found: ${user.name} (${user.email}) - Language: ${user.language}\n`);

  // ============================================
  // 2. VERIFY PLAN EXISTS & CREATE BASE TEMPLATES
  // ============================================
  const planId = "cmhoundxg00011800vu0x9gfd";

  console.log(`📋 Checking if plan ${planId} exists...`);
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!plan) {
    throw new Error(`❌ Plan with ID ${planId} not found! Please create the plan first.`);
  }

  console.log(`✅ Plan found: ${plan.name} (${plan.slug})\n`);

  console.log("📋 Creating base templates...");

  const classicTemplate = await prisma.template.upsert({
    where: { slug: "classic-memorial" },
    update: {
      plans: {
        connect: { id: planId },
      },
    },
    create: {
      name: "Classic Memorial",
      slug: "classic-memorial",
      description: "A timeless, elegant design perfect for honoring cherished memories",
      category: "traditional",
      version: "1.0.0",
      componentPath: "templates/classic/MemorialTemplate",
      previewImage: "/images/templates/classic-preview.jpg",
      thumbnailImage: "/images/templates/classic-thumb.jpg",
      supportedSections: [
        "HERO",
        "BIOGRAPHY",
        "GALLERY",
        "TIMELINE",
        "TRIBUTES",
        "FUNERAL_INFO",
        "GUESTBOOK",
      ],
      layoutType: "SINGLE_COLUMN",
      designTokens: {
        colors: {
          primary: "#2c3e50",
          secondary: "#34495e",
          accent: "#e74c3c",
          background: "#ecf0f1",
          text: "#2c3e50",
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Open Sans, sans-serif",
        },
        spacing: {
          section: "4rem",
          element: "2rem",
        },
      },
      defaultConfig: {
        showHero: true,
        showBiography: true,
        showGallery: true,
        showTimeline: true,
        showGuestbook: true,
      },
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
      usageCount: 0,
      plans: {
        connect: { id: planId },
      },
    },
  });

  console.log(`✅ Created/Updated template: ${classicTemplate.name}`);

  const modernTemplate = await prisma.template.upsert({
    where: { slug: "modern-memorial" },
    update: {
      plans: {
        connect: { id: planId },
      },
    },
    create: {
      name: "Modern Memorial",
      slug: "modern-memorial",
      description: "A contemporary design with clean lines and vibrant storytelling",
      category: "contemporary",
      version: "1.0.0",
      componentPath: "templates/modern/MemorialTemplate",
      previewImage: "/images/templates/modern-preview.jpg",
      thumbnailImage: "/images/templates/modern-thumb.jpg",
      supportedSections: [
        "HERO",
        "BIOGRAPHY",
        "GALLERY",
        "TIMELINE",
        "TRIBUTES",
        "FUNERAL_INFO",
        "VIRTUAL_CANDLES",
        "VIRTUAL_FLOWERS",
      ],
      layoutType: "TWO_COLUMN",
      designTokens: {
        colors: {
          primary: "#3498db",
          secondary: "#2980b9",
          accent: "#f39c12",
          background: "#ffffff",
          text: "#333333",
        },
        fonts: {
          heading: "Montserrat, sans-serif",
          body: "Roboto, sans-serif",
        },
        spacing: {
          section: "3rem",
          element: "1.5rem",
        },
      },
      defaultConfig: {
        showHero: true,
        showBiography: true,
        showGallery: true,
        showTimeline: true,
        showCandles: true,
        showFlowers: true,
      },
      isActive: true,
      isFeatured: false,
      displayOrder: 2,
      usageCount: 0,
      plans: {
        connect: { id: planId },
      },
    },
  });

  console.log(`✅ Created/Updated template: ${modernTemplate.name}`);
  console.log(`   Connected to plan: ${plan.name}\n`);

  // ============================================
  // 3. CREATE USER TEMPLATE
  // ============================================
  console.log("📋 Creating UserTemplate for user...");

  const userTemplate = await prisma.userTemplate.create({
    data: {
      name: "My Classic Memorial Template",
      description: "Customized classic template for my memorial pages",
      userId: user.id,
      baseTemplateId: classicTemplate.id,
      config: {
        colors: {
          primary: "#2c3e50",
          secondary: "#34495e",
          accent: "#c0392b", // Slightly customized accent color
          background: "#f5f5f5",
          text: "#2c3e50",
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Open Sans, sans-serif",
        },
        layout: {
          maxWidth: "1200px",
          heroHeight: "500px",
        },
      },
      sections: {
        order: [
          "HERO",
          "BIOGRAPHY",
          "TIMELINE",
          "GALLERY",
          "FUNERAL_INFO",
          "TRIBUTES",
          "GUESTBOOK",
        ],
        visibility: {
          HERO: true,
          BIOGRAPHY: true,
          TIMELINE: true,
          GALLERY: true,
          FUNERAL_INFO: true,
          TRIBUTES: true,
          GUESTBOOK: true,
        },
      },
      isActive: true,
      isPublished: true,
    },
  });

  console.log(`✅ Created UserTemplate: ${userTemplate.name} (ID: ${userTemplate.id})\n`);

  // ============================================
  // 4. CREATE TEST MEMORIAL
  // ============================================
  console.log("📋 Creating test memorial...");

  // Generate unique slug
  const memorialSlug = `john-doe`;

  const memorial = await prisma.memorial.create({
    data: {
      // Required fields
      slug: memorialSlug,
      firstName: "John",
      lastName: "Doe",
      middleName: "Michael",
      birthDate: new Date("1950-03-15"),
      deathDate: new Date("2024-11-05"),
      ownerId: user.id,
      userTemplateId: userTemplate.id,

      // Optional personal information
      prefix: "Dr.",
      nicknames: ["JM", "Johnny", "Prof"],
      age: 74,
      birthPlace: "Lagos, Nigeria",
      deathPlace: "Lagos, Nigeria",
      hometown: "Ibadan, Nigeria",
      residence: "Lagos, Nigeria",
      nationality: "Nigerian",

      // Biography and life story
      biography: `Dr. John Michael Adeyemi was a distinguished professor, loving father, and pillar of his community. Born in Lagos on March 15, 1950, he dedicated his life to education and the advancement of knowledge in African literature and history.

After completing his doctorate at the University of Ibadan, Dr. Adeyemi spent over 40 years teaching and mentoring thousands of students. His groundbreaking research on West African oral traditions earned him numerous awards and international recognition.

Beyond academia, John was known for his warm smile, infectious laughter, and unwavering commitment to family. He loved playing chess, telling stories, and hosting Sunday dinners where his home was always filled with friends and extended family.

John is survived by his beloved wife of 45 years, three children, seven grandchildren, and countless students whose lives he touched. His legacy of wisdom, kindness, and dedication to excellence will continue to inspire generations to come.`,

      epitaph:
        "A life lived in service to knowledge, family, and community. Forever in our hearts.",

      obituary: `Dr. John Michael Adeyemi, 74, passed away peacefully on November 5, 2024, surrounded by his loving family. A celebrated academic and beloved community leader, Dr. Adeyemi touched countless lives through his teaching, research, and mentorship.

He is survived by his wife, Dr. Funmilayo Adeyemi; his children, Tunde (spouse Kemi), Yetunde (spouse Bayo), and Femi; and seven grandchildren. He was preceded in death by his parents and his sister.

The family welcomes friends and colleagues to celebrate John's remarkable life at the memorial service. In lieu of flowers, donations may be made to the John M. Adeyemi Education Fund, supporting scholarships for underprivileged students in Nigeria.`,

      lifeStory: `Born in the vibrant city of Lagos during Nigeria's colonial era, John Michael Adeyemi's journey would take him from humble beginnings to the pinnacle of academic excellence.

As a young boy, John displayed an insatiable curiosity about the world. His mother, a schoolteacher, nurtured this passion by reading to him every night. His father, a civil servant, instilled in him the values of hard work and integrity.

John excelled in his studies, earning a scholarship to the prestigious University of Ibadan. There, he discovered his calling in African literature and oral traditions. His doctoral thesis, "The Evolution of Yoruba Folklore in Modern Nigerian Literature," became a seminal work in the field.

Throughout his career, Dr. Adeyemi published over 50 academic papers, authored 5 books, and served as a visiting professor at universities across Africa, Europe, and North America. Yet, despite his achievements, he remained humble and accessible to all who sought his guidance.

His marriage to Funmilayo in 1979 marked the beginning of a beautiful partnership. Together, they raised three accomplished children and created a home filled with love, learning, and laughter.

In his retirement years, John found joy in his grandchildren, his garden, and his ever-growing library. He continued to mentor young scholars and remained actively involved in community development initiatives.`,

      legacy: `Dr. John Michael Adeyemi's legacy extends far beyond his academic achievements. He was a man who believed in the power of education to transform lives and communities.

His contributions to African literary scholarship have shaped how generations understand and appreciate African oral traditions. The countless students he mentored have gone on to become leaders in their own right, carrying forward his values of excellence, integrity, and service.

The John M. Adeyemi Education Fund, established in his honor, will continue his mission of making quality education accessible to all, regardless of economic circumstances.

But perhaps his greatest legacy is the love he shared with his family and the example he set for living a life of purpose, compassion, and unwavering dedication to making the world a better place.`,

      // Media
      profilePhoto: "/images/memorials/john-adeyemi-profile.jpg",
      coverPhoto: "/images/memorials/john-adeyemi-cover.jpg",
      galleryPhotos: [
        "/images/memorials/john-adeyemi-1.jpg",
        "/images/memorials/john-adeyemi-2.jpg",
        "/images/memorials/john-adeyemi-3.jpg",
        "/images/memorials/john-adeyemi-family.jpg",
        "/images/memorials/john-adeyemi-graduation.jpg",
        "/images/memorials/john-adeyemi-teaching.jpg",
      ],

      // Funeral information
      funeralDate: new Date("2024-11-22T10:00:00Z"),
      funeralLocation: "Cathedral Church of Christ, Lagos, Nigeria",
      funeralDetails: `Service of Songs: Thursday, November 21, 2024, 6:00 PM
Location: Family Residence, 45 Victoria Island, Lagos

Funeral Service: Friday, November 22, 2024, 10:00 AM
Location: Cathedral Church of Christ, Marina, Lagos
Officiating: Archbishop Samuel Ogunlade

Reception: Immediately following the service
Location: Nigerian Institute of Advanced Studies Hall

Burial: Private family interment

Dress Code: Traditional Nigerian attire or formal wear
Colors: White and gold (celebrating a life well lived)

For out-of-town guests, accommodation has been arranged at the Eko Hotel & Suites. Please contact the family for details.

Live streaming will be available for those unable to attend in person.`,

      burialPlace: "Ikoyi Cemetery, Lagos, Nigeria",
      burialDate: new Date("2024-11-22T15:00:00Z"),
      memorialService: `A memorial service celebrating Dr. Adeyemi's contributions to education will be held at the University of Ibadan on December 1, 2024, at 2:00 PM.

All former students, colleagues, and friends are warmly invited to share their memories and pay tribute to this remarkable educator.`,

      // Charity information
      charityName: "John M. Adeyemi Education Fund",
      charityUrl: "https://www.adeyemieducationfund.org",
      donationInfo: `In lieu of flowers, the family requests that donations be made to the John M. Adeyemi Education Fund.

This fund, established in Dr. Adeyemi's honor, provides scholarships and educational resources to underprivileged students in Nigeria, continuing his lifelong mission of making quality education accessible to all.

Donations can be made:
- Online: www.adeyemieducationfund.org
- Bank Transfer: Access Bank, Account Number: 1234567890, Account Name: JMA Education Fund
- Checks: Payable to "John M. Adeyemi Education Fund" and mailed to the family address

Every contribution, no matter the size, will help carry forward John's legacy of educational excellence and opportunity.`,

      // Memorial settings
      visibility: "PUBLIC",
      allowComments: true,
      moderateComments: false,
      allowPhotos: true,
      allowStories: true,
      allowCandles: true,
      allowFlowers: true,
      language: user.language || "en",

      // Publication
      isPublished: true,
      publishedAt: new Date(),
      isPremium: false,

      // SEO
      metaTitle: "In Loving Memory of Dr. John Michael Adeyemi (1950-2024)",
      metaDescription:
        "Celebrate the life and legacy of Dr. John Michael Adeyemi, distinguished professor, loving father, and community leader. Join us in honoring his memory.",
      keywords: [
        "John Adeyemi",
        "Dr. John Adeyemi",
        "Nigerian professor",
        "African literature",
        "Yoruba folklore",
        "University of Ibadan",
        "memorial",
        "obituary",
        "celebration of life",
      ],

      // Statistics (initialized to 0)
      viewCount: 0,
      shareCount: 0,
      candleCount: 0,
      flowerCount: 0,
    },
  });

  console.log(`✅ Created memorial: ${memorial.firstName} ${memorial.lastName}`);
  console.log(`   Slug: ${memorial.slug}`);
  console.log(`   URL: /memorial/${memorial.slug}`);
  console.log(`   Published: ${memorial.isPublished}`);
  console.log(`   Template: ${userTemplate.name}\n`);

  // ============================================
  // 5. CREATE SAMPLE INVITATIONS (Optional - for testing localization)
  // ============================================
  console.log("📋 Creating sample invitations for testing localization...");

  const invitations = [
    {
      email: "tunde.adeyemi@example.com",
      name: "Tunde Adeyemi",
      role: "VIEWER" as const,
      note: "Family (English)",
    },
    {
      email: "yetunde.adeyemi@example.com",
      name: "Yetunde Adeyemi",
      role: "VIEWER" as const,
      note: "Family (English)",
    },
    {
      email: "femi.adeyemi@example.com",
      name: "Femi Adeyemi",
      role: "VIEWER" as const,
      note: "Family (English)",
    },
    {
      email: "carlos.rodriguez@example.com",
      name: "Carlos Rodriguez",
      role: "VIEWER" as const,
      note: "Friend (Spanish speaker - test ES localization)",
    },
    {
      email: "marie.dubois@example.com",
      name: "Marie Dubois",
      role: "VIEWER" as const,
      note: "Friend (French speaker - test FR localization)",
    },
    {
      email: "adekunle.ogunlade@example.com",
      name: "Adekunle Ogunlade",
      role: "VIEWER" as const,
      note: "Colleague (Yoruba speaker - test YO localization)",
    },
    {
      email: "chinedu.okeke@example.com",
      name: "Chinedu Okeke",
      role: "VIEWER" as const,
      note: "Colleague (Igbo speaker - test IG localization)",
    },
    {
      email: "aisha.mohammed@example.com",
      name: "Aisha Mohammed",
      role: "VIEWER" as const,
      note: "Colleague (Hausa speaker - test HA localization)",
    },
  ];

  for (const invitationData of invitations) {
    const invitation = await prisma.invitation.create({
      data: {
        memorialId: memorial.id,
        email: invitationData.email,
        name: invitationData.name,
        role: invitationData.role,
        invitedById: user.id,
        token: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        rsvpToken: `rsvp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        status: "PENDING",
        rsvpStatus: null, // No RSVP response yet
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Expires in 90 days
        sentViaEmail: false,
        sentViaWhatsApp: false,
        message: `You are invited to the memorial service of Dr. John Michael Adeyemi. ${invitationData.note}`,
      },
    });

    console.log(`✅ Created invitation: ${invitation.name} - ${invitation.email}`);
    console.log(`   Note: ${invitationData.note}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEEDING COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`   - User: ${user.name} (${user.email})`);
  console.log(`   - Templates Created: 2 (Classic, Modern)`);
  console.log(`   - UserTemplate Created: 1`);
  console.log(`   - Memorial Created: 1`);
  console.log(`   - Memorial Slug: ${memorial.slug}`);
  console.log(`   - Memorial URL: /memorial/${memorial.slug}`);
  console.log(`   - Invitations Created: ${invitations.length}`);
  console.log(`   - Languages Tested: en, es, fr, yo, ig, ha`);
  console.log("\n🧪 Testing Instructions:");
  console.log(`   1. Visit: http://localhost:3000/memorial/${memorial.slug}`);
  console.log(`   2. Test invitation emails with different languages`);
  console.log(`   3. Test RSVP pages with localization`);
  console.log(`   4. Verify all 6 language translations work correctly`);
  console.log("\n✨ Happy Testing! ✨\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
