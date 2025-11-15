import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get language from query params or header, default to 'en'
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get("lang") || searchParams.get("language") || "en";

    // Fetch all visible plans with their translations
    const plans = await prisma.plan.findMany({
      where: {
        isVisible: true,
      },
      include: {
        translations: {
          where: {
            language: language,
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    // Transform the data to a more frontend-friendly format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedPlans = plans.map((plan: any) => {
      const translation = plan.translations[0];

      return {
        id: plan.id,
        slug: plan.slug,
        name: translation?.name || plan.name,
        description: translation?.description || plan.description,
        // Multi-currency pricing
        priceNGN: plan.priceNGN?.toString() || "0",
        priceUSD: plan.priceUSD?.toString() || null,
        priceGBP: plan.priceGBP?.toString() || null,
        priceEUR: plan.priceEUR?.toString() || null,
        currency: plan.currency,
        durationDays: plan.durationDays,
        isPopular: plan.isPopular,
        badgeText: translation?.badgeText || plan.badgeText,
        badgeColor: plan.badgeColor,
        features: translation?.features || {},
        limits: {
          maxMemorials: plan.maxMemorials,
          maxPhotosPerMemorial: plan.maxPhotosPerMemorial,
          maxVideosPerMemorial: plan.maxVideosPerMemorial,
          maxAdmins: plan.maxAdmins,
          maxContributors: plan.maxContributors,
          storageQuotaMB: plan.storageQuotaMB,
        },
        permissions: {
          allowRSVP: plan.allowRSVP,
          allowGuestbook: plan.allowGuestbook,
          allowVirtualTributes: plan.allowVirtualTributes,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedPlans,
      language: language,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plans",
      },
      { status: 500 }
    );
  }
}
