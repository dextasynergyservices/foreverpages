import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const size = parseInt(searchParams.get("size") || "256", 10);
    const margin = parseInt(searchParams.get("margin") || "2", 10);
    const darkColor = searchParams.get("dark") || "000000";
    const lightColor = searchParams.get("light") || "ffffff";
    const format = searchParams.get("format") || "png";

    if (!slug) {
      return NextResponse.json({ error: "Memorial slug is required" }, { status: 400 });
    }

    // Validate size
    const validatedSize = Math.min(Math.max(size, 64), 1024);

    // Validate margin
    const validatedMargin = Math.min(Math.max(margin, 0), 10);

    // Build the memorial URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://foreverpages.com";

    const memorialUrl = `${baseUrl}/memorial/${slug}`;

    // Generate QR code based on format
    if (format === "svg") {
      const svgString = await QRCode.toString(memorialUrl, {
        type: "svg",
        width: validatedSize,
        margin: validatedMargin,
        color: {
          dark: `#${darkColor}`,
          light: `#${lightColor}`,
        },
      });

      return new NextResponse(svgString, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "Content-Disposition": `inline; filename="${slug}-qr-code.svg"`,
        },
      });
    }

    // Default: PNG format
    const qrBuffer = await QRCode.toBuffer(memorialUrl, {
      width: validatedSize,
      margin: validatedMargin,
      color: {
        dark: `#${darkColor}`,
        light: `#${lightColor}`,
      },
    });

    return new NextResponse(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Content-Disposition": `inline; filename="${slug}-qr-code.png"`,
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
