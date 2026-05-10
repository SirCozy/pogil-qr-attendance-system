import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "lecturer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { lecturerId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attendances: true } } },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "lecturer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { course } = await request.json();
  if (!course?.trim()) {
    return NextResponse.json({ error: "Course name is required" }, { status: 400 });
  }

  const qrCode = uuidv4();
  const newSession = await prisma.session.create({
    data: {
      course: course.trim(),
      qrCode,
      lecturerId: session.userId,
    },
    include: { _count: { select: { attendances: true } } },
  });

  return NextResponse.json(newSession, { status: 201 });
}
