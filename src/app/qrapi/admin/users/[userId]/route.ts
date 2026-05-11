import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (session.userId === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be deleted" }, { status: 400 });
  }

  try {
    if (user.role === "student") {
      await prisma.attendance.deleteMany({ where: { studentId: id } });
      await prisma.registrationCode.updateMany({
        where: { usedById: id },
        data: { usedById: null, usedAt: null },
      });
      await prisma.user.delete({ where: { id } });
    } else if (user.role === "lecturer") {
      const lecturerSessions = await prisma.session.findMany({
        where: { lecturerId: id },
        select: { id: true },
      });
      const sessionIds = lecturerSessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        await prisma.attendance.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await prisma.session.deleteMany({ where: { lecturerId: id } });
      }
      await prisma.user.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
