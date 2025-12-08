import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/templates/[id]/preview-render
 * Get template with mock memorial data for preview rendering
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Create mock memorial data for preview
    const mockMemorial = {
      id: "preview-memorial",
      slug: "preview",
      firstName: "John",
      lastName: "Doe",
      middleName: "Michael",
      maidenName: null,
      nicknames: ["Johnny"],
      prefix: "Mr.",
      suffix: null,
      birthDate: new Date("1950-01-15"),
      deathDate: new Date("2024-11-20"),
      age: 74,
      birthPlace: "New York, USA",
      deathPlace: "Los Angeles, USA",
      hometown: "Brooklyn, NY",
      residence: "Santa Monica, CA",
      nationality: "American",
      biography:
        "John Michael Doe was a beloved father, grandfather, and friend. He dedicated his life to helping others and making the world a better place. His warm smile and generous heart touched countless lives.",
      epitaph: "Forever in our hearts, guiding us with love from above",
      obituary:
        "John peacefully passed away surrounded by his loving family. He is survived by his wife Mary, three children, and seven grandchildren.",
      lifeStory:
        "Born in Brooklyn during the post-war era, John grew up with strong family values. He pursued his passion for education and spent 40 years as a beloved teacher, inspiring generations of students.",
      legacy:
        "John's legacy lives on through his family, the students he mentored, and the community programs he established.",
      profilePhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      coverPhoto:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop",
      galleryPhotos: [
        "https://images.unsplash.com/photo-1533093818801-37f65a8016f2?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1476357471311-43c0db9fb2b4?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1444210971048-6130cf0c46cf?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1452457807411-4979b707c5be?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=400&fit=crop",
      ],
      funeralDate: new Date("2024-11-25"),
      funeralLocation: "Grace Memorial Chapel, Los Angeles, CA",
      funeralDetails:
        "Memorial service will be held at 2:00 PM. Reception to follow. In lieu of flowers, donations may be made to the education fund.",
      burialPlace: "Forest Lawn Memorial Park",
      burialDate: new Date("2024-11-25"),
      memorialService: "A celebration of life will be held to honor John's memory and legacy.",
      charityName: "Children's Education Foundation",
      charityUrl: "https://example.com/charity",
      donationInfo: "Donations can be made in John's memory to support underprivileged students.",
      visibility: "PUBLIC" as const,
      allowComments: true,
      moderateComments: false,
      allowPhotos: true,
      allowStories: true,
      allowCandles: true,
      allowFlowers: true,
      language: "en",
      qrCodeUrl: null,
      customDomain: null,
      password: null,
      metaTitle: "In Memory of John Michael Doe",
      metaDescription: "Celebrating the life and legacy of John Michael Doe (1950-2024)",
      keywords: ["memorial", "tribute", "obituary"],
      viewCount: 0,
      shareCount: 0,
      candleCount: 0,
      flowerCount: 0,
      isPublished: true,
      isPremium: false,
      expiresAt: null,
      version: 1,
      lastEditedBy: null,
      lastEditedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      ownerId: session.user.id,
      userTemplateId: null,
    };

    // Create mock UserTemplate
    const mockUserTemplate = {
      id: "preview-user-template",
      name: template.name,
      description: template.description,
      userId: session.user.id,
      baseTemplateId: template.id,
      baseTemplate: template,
      config: template.designTokens || null,
      sections: template.defaultConfig || null,
      isActive: true,
      isPublished: false,
      customPreviewImage: null,
      customThumbnailImage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      template,
      memorial: mockMemorial,
      userTemplate: mockUserTemplate,
    });
  } catch (error) {
    console.error("Error fetching template preview render:", error);
    return NextResponse.json({ message: "Failed to fetch template preview data" }, { status: 500 });
  }
}
