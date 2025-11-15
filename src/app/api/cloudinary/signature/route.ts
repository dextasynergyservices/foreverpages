import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateSignature } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { folder, uploadPreset, publicId, timestamp, eager, tags } = body;

    // Generate signature
    const params: Record<string, string | number | string[]> = {
      upload_preset: uploadPreset,
    };

    if (folder) params.folder = folder;
    if (publicId) params.public_id = publicId;
    if (timestamp) params.timestamp = timestamp;
    if (eager) params.eager = eager;
    if (tags) params.tags = tags;

    const { signature, timestamp: generatedTimestamp } = generateSignature(params);

    return NextResponse.json({
      success: true,
      signature,
      timestamp: generatedTimestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
