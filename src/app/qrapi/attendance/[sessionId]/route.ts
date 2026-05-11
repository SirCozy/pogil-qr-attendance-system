import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "lecturer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const id = parseInt(sessionId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  const attendanceSession = await prisma.session.findFirst({
    where: { id, lecturerId: session.userId },
  });

  if (!attendanceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const attendances = await prisma.attendance.findMany({
    where: { sessionId: id },
    orderBy: { timestamp: "asc" },
    include: {
      student: { select: { name: true, matricNo: true } },
    },
  });

  return NextResponse.json(attendances);
}
