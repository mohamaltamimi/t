import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status && status !== "all" ? { status } : {};

    const sops = await prisma.sOP.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(sops);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, category, version, status } = body;

    if (!title || !description || !content || !category) {
      return NextResponse.json(
        { error: "Title, description, content, and category are required" },
        { status: 400 }
      );
    }

    const sop = await prisma.sOP.create({
      data: {
        title,
        description,
        content,
        category,
        version: version || "1.0",
        status: status || "draft",
      },
    });

    return NextResponse.json(sop, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
