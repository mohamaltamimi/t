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

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
        location: true,
        responses: {
          include: { user: true },
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
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
    const body = await request.json();
    const { title, description, category, locationId, questions, status } = body;

    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Delete old questions and create new ones in a transaction
    const audit = await prisma.$transaction(async (tx) => {
      await tx.auditQuestion.deleteMany({ where: { auditId: id } });

      return tx.audit.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          description: description ?? existing.description,
          category: category ?? existing.category,
          locationId: locationId !== undefined ? locationId || null : existing.locationId,
          status: status ?? existing.status,
          questions: {
            create: (questions || []).map(
              (
                q: { question: string; type: string; weight: number },
                index: number
              ) => ({
                question: q.question,
                type: q.type || "yes_no",
                weight: q.weight ?? 1.0,
                sortOrder: index,
              })
            ),
          },
        },
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
          },
          location: true,
          _count: {
            select: { responses: true },
          },
        },
      });
    });

    return NextResponse.json(audit);
  } catch (error) {
    console.error("Failed to update audit:", error);
    return NextResponse.json(
      { error: "Failed to update audit" },
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

    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Delete responses first (no cascade), then audit (questions cascade)
    await prisma.$transaction(async (tx) => {
      await tx.auditResponse.deleteMany({ where: { auditId: id } });
      await tx.audit.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Audit deleted successfully" });
  } catch (error) {
    console.error("Failed to delete audit:", error);
    return NextResponse.json(
      { error: "Failed to delete audit" },
      { status: 500 }
    );
  }
}
