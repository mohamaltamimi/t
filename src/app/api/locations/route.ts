import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(locations);
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

    if (user.role !== "admin" && user.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, address, city, region, type, status } = await request.json();

    if (!name || !address || !city || !region) {
      return NextResponse.json(
        { error: "Name, address, city, and region are required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        city,
        region,
        type: type || "store",
        status: status || "active",
      },
      include: {
        _count: {
          select: {
            users: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
