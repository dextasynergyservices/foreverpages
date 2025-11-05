import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.memorial.count();

    // Get paginated memorials
    const memorials = await prisma.memorial.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        biography: true,
        profilePhoto: true,
        coverPhoto: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        birthDate: true,
        deathDate: true,
      },
    });

    const pages = Math.ceil(total / limit);

    // Map to the expected format
    const mappedMemorials = memorials.map((m) => ({
      id: m.id,
      title: `${m.firstName} ${m.lastName}`,
      description: m.biography || "",
      imageUrl: m.profilePhoto || m.coverPhoto || "https://picsum.photos/800/600?random",
      createdBy: m.ownerId,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      message: "Memorials retrieved successfully",
      data: {
        memorials: mappedMemorials,
        total,
        pages,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error("Memorials fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to create a memorial" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, biography, birthDate, deathDate, profilePhoto } = body;

    // Basic validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { message: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (!birthDate || !deathDate) {
      return NextResponse.json(
        { message: "Birth date and death date are required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`;

    // Create memorial
    const memorial = await prisma.memorial.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        slug,
        biography: biography?.trim() || "",
        birthDate: new Date(birthDate),
        deathDate: new Date(deathDate),
        profilePhoto: profilePhoto || null,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        biography: true,
        profilePhoto: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        birthDate: true,
        deathDate: true,
      },
    });

    return NextResponse.json(
      {
        message: "Memorial created successfully",
        data: {
          id: memorial.id,
          title: `${memorial.firstName} ${memorial.lastName}`,
          description: memorial.biography || "",
          imageUrl: memorial.profilePhoto || "https://picsum.photos/800/600?random",
          createdBy: memorial.ownerId,
          createdAt: memorial.createdAt.toISOString(),
          updatedAt: memorial.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Memorial creation error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
