import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userTemplateId, slug, firstName, lastName } = body;

    if (!userTemplateId || !slug || !firstName || !lastName) {
      return NextResponse.json(
        { message: "Missing required fields: userTemplateId, slug, firstName, lastName" },
        { status: 400 }
      );
    }

    // Verify user owns the template
    const userTemplate = await prisma.userTemplate.findFirst({
      where: {
        id: userTemplateId,
        userId: session.user.id,
      },
      include: {
        baseTemplate: true,
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found or unauthorized" }, { status: 403 });
    }

    // Check if user has active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ["ACTIVE", "GRACE_PERIOD"],
        },
      },
      orderBy: { expiresAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json(
        { message: "Active subscription required to publish" },
        { status: 403 }
      );
    }

    // Check if slug is already taken
    const existingMemorial = await prisma.memorial.findUnique({
      where: { slug },
    });

    if (existingMemorial) {
      return NextResponse.json(
        { message: "This slug is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Create memorial
    const memorial = await prisma.memorial.create({
      data: {
        slug,
        firstName,
        lastName,
        birthDate: new Date(), // Will be updated in next step
        deathDate: new Date(), // Will be updated in next step
        ownerId: session.user.id,
        userTemplateId,
        isPublished: true,
        publishedAt: new Date(),
        expiresAt: subscription.expiresAt,
      },
    });

    // Update UserTemplate as published
    await prisma.userTemplate.update({
      where: { id: userTemplateId },
      data: { isPublished: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      message: "Memorial published successfully",
      data: {
        memorialId: memorial.id,
        slug: memorial.slug,
        publishedUrl: `${appUrl}/memorial/${memorial.slug}`,
        isPublished: true,
      },
    });
  } catch (error) {
    console.error("Error publishing memorial:", error);
    return NextResponse.json({ message: "Failed to publish memorial" }, { status: 500 });
  }
}
