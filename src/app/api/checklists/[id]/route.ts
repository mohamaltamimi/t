import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const checklist = await prisma.checklist.findUnique({
      where: { id },
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

    if (!checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Failed to fetch checklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.checklist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, category, frequency, locationId, status, items } = body;

    // Delete existing items and recreate them
    await prisma.checklistItem.deleteMany({
      where: { checklistId: id },
    });

    const checklist = await prisma.checklist.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(frequency !== undefined && { frequency }),
        ...(locationId !== undefined && { locationId: locationId || null }),
        ...(status !== undefined && { status }),
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

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Failed to update checklist:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.checklist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    await prisma.checklist.delete({ where: { id } });

    return NextResponse.json({ message: "Checklist deleted" });
  } catch (error) {
    console.error("Failed to delete checklist:", error);
    return NextResponse.json(
      { error: "Failed to delete checklist" },
      { status: 500 }
    );
  }
}
