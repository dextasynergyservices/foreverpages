import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "File size must be less than 5MB" }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(base64, {
      folder: "foreverpages/invitation-cards",
      resourceType: "image",
      tags: ["invitation-card", session.user.id],
      transformation: [
        {
          width: 800,
          height: 600,
          crop: "limit",
          quality: "auto:good",
        },
      ],
    });

    return NextResponse.json({
      message: "Invitation card uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnailUrl: result.thumbnail_url,
      },
    });
  } catch (error) {
    console.error("Invitation card upload error:", error);
    return NextResponse.json({ message: "Failed to upload invitation card" }, { status: 500 });
  }
}
