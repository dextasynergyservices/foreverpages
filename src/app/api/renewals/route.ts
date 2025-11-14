import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/renewals
 * Fetch active renewal options with translations
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";

    // Fetch active renewals with translations
    const renewals = await prisma.renewal.findMany({
      where: {
        isActive: true,
      },
      include: {
        translations: {
          where: {
            language: lang,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform data to include translation or fallback
    const transformedRenewals = renewals.map((renewal: (typeof renewals)[0]) => {
      const translation = renewal.translations[0];

      return {
        id: renewal.id,
        slug: renewal.slug,
        name: translation?.name || renewal.name,
        description: translation?.description || renewal.description,
        badgeText: translation?.badgeText || renewal.badgeText,
        badgeColor: renewal.badgeColor,
        features: translation?.features || {},
        priceNGN: renewal.priceNGN?.toString() || "0",
        priceUSD: renewal.priceUSD?.toString() || "0",
        priceGBP: renewal.priceGBP?.toString() || "0",
        priceEUR: renewal.priceEUR?.toString() || "0",
        currency: renewal.currency,
        isActive: renewal.isActive,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedRenewals,
    });
  } catch (error) {
    console.error("Error fetching renewals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch renewal options",
      },
      { status: 500 }
    );
  }
}
