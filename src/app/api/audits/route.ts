import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const audits = await prisma.audit.findMany({
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
        location: true,
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error("Failed to fetch audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch audits" },
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
    const { title, description, category, locationId, questions } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    const audit = await prisma.audit.create({
      data: {
        title,
        description,
        category,
        locationId: locationId || null,
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

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit:", error);
    return NextResponse.json(
      { error: "Failed to create audit" },
      { status: 500 }
    );
  }
}
