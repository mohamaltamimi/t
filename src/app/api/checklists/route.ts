import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checklists = await prisma.checklist.findMany({
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        location: true,
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error("Failed to fetch checklists:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, frequency, locationId, items } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    const checklist = await prisma.checklist.create({
      data: {
        title,
        description,
        category,
        frequency: frequency || "daily",
        locationId: locationId || null,
        items: {
          create: (items || []).map(
            (
              item: { label: string; type: string; required: boolean },
              index: number
            ) => ({
              label: item.label,
              type: item.type || "checkbox",
              required: item.required ?? true,
              sortOrder: index,
            })
          ),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        location: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error("Failed to create checklist:", error);
    return NextResponse.json(
      { error: "Failed to create checklist" },
      { status: 500 }
    );
  }
}
