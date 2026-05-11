import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attendances = await prisma.attendance.findMany({
    where: { studentId: session.userId },
    orderBy: { timestamp: "desc" },
    include: {
      session: { select: { course: true, createdAt: true } },
    },
  });

  return NextResponse.json(attendances);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { qrCode } = await request.json();
  if (!qrCode) {
    return NextResponse.json({ error: "QR code is required" }, { status: 400 });
  }

  const attendanceSession = await prisma.session.findUnique({
    where: { qrCode },
  });

  if (!attendanceSession) {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      studentId_sessionId: {
        studentId: session.userId,
        sessionId: attendanceSession.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Attendance already marked for this session" },
      { status: 409 }
    );
  }

  const attendance = await prisma.attendance.create({
    data: {
      studentId: session.userId,
      sessionId: attendanceSession.id,
    },
  });

  return NextResponse.json(
    { ...attendance, course: attendanceSession.course },
    { status: 201 }
  );
}
