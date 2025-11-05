import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to access tributes" },
        { status: 401 }
      );
    }

    // Get user's memorials first
    const userMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    const memorialIds = userMemorials.map((m: { id: string }) => m.id);

    // Get tributes (posts with type TRIBUTE) for user's memorials
    const tributes = await prisma.post.findMany({
      where: {
        memorialId: { in: memorialIds },
        type: "TRIBUTE",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
        authorName: true,
        authorEmail: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Tributes retrieved successfully",
      data: {
        tributes: tributes.map((tribute) => ({
          id: tribute.id,
          author: tribute.author?.name || tribute.authorName || "Anonymous",
          email: tribute.author?.email || tribute.authorEmail || "anonymous@example.com",
          message: tribute.content,
          date: tribute.createdAt.toISOString().split("T")[0], // Format as YYYY-MM-DD
          status: tribute.isApproved ? "approved" : "pending",
          createdAt: tribute.createdAt.toISOString(),
          updatedAt: tribute.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Tributes fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to update tributes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ message: "Missing required fields: id, status" }, { status: 400 });
    }

    // Verify the tribute (post) belongs to user's memorial
    const tribute = await prisma.post.findFirst({
      where: {
        id,
        type: "TRIBUTE",
        memorial: {
          ownerId: session.user.id,
        },
      },
    });

    if (!tribute) {
      return NextResponse.json({ message: "Tribute not found or access denied" }, { status: 404 });
    }

    // Map status to isApproved boolean
    const isApproved = status === "approved";

    // Update the tribute status
    const updatedTribute = await prisma.post.update({
      where: { id },
      data: { isApproved },
      select: {
        id: true,
        content: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
        authorName: true,
        authorEmail: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Tribute updated successfully",
      data: {
        tribute: {
          id: updatedTribute.id,
          author: updatedTribute.author?.name || updatedTribute.authorName || "Anonymous",
          email:
            updatedTribute.author?.email || updatedTribute.authorEmail || "anonymous@example.com",
          message: updatedTribute.content,
          date: updatedTribute.createdAt.toISOString().split("T")[0],
          status: updatedTribute.isApproved ? "approved" : "pending",
          createdAt: updatedTribute.createdAt.toISOString(),
          updatedAt: updatedTribute.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Tribute update error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
