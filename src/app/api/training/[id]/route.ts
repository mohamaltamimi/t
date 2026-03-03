import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { sortOrder: "asc" } },
      progress: { include: { user: true } },
    },
  });

  if (!training) {
    return NextResponse.json({ error: "Training not found" }, { status: 404 });
  }

  return NextResponse.json({ training });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, content, category, duration, status, modules } = body;

    if (!title || !description || !content || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Delete old modules and create new ones in a transaction
    const training = await prisma.$transaction(async (tx) => {
      await tx.trainingModule.deleteMany({ where: { trainingId: id } });

      return tx.training.update({
        where: { id },
        data: {
          title,
          description,
          content,
          category,
          duration: duration ? parseInt(duration, 10) : 30,
          status: status || "draft",
          modules: {
            create: (modules || []).map(
              (mod: { title: string; content: string; type: string }, index: number) => ({
                title: mod.title,
                content: mod.content,
                type: mod.type || "lesson",
                sortOrder: index,
              })
            ),
          },
        },
        include: {
          modules: { orderBy: { sortOrder: "asc" } },
          _count: { select: { progress: true } },
        },
      });
    });

    return NextResponse.json({ training });
  } catch (error) {
    console.error("Failed to update training:", error);
    return NextResponse.json({ error: "Failed to update training" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.training.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete training:", error);
    return NextResponse.json({ error: "Failed to delete training" }, { status: 500 });
  }
}
