import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

  const wb = XLSX.utils.book_new();

  const title = [
    ["POGIL COLLEGE OF HEALTH TECHNOLOGY"],
    ["Computer Science Department — ND II (2024/2025)"],
    [],
    ["Course:", attendanceSession.course],
    ["Session Date:", new Date(attendanceSession.createdAt).toLocaleString()],
    ["Total Present:", attendances.length],
    [],
    ["S/N", "Student Name", "Matric Number", "Date", "Time"],
  ];

  const rows = attendances.map((a, i) => {
    const ts = new Date(a.timestamp);
    return [
      i + 1,
      a.student.name,
      a.student.matricNo ?? "",
      ts.toLocaleDateString(),
      ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ];
  });

  const wsData = [...title, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 10 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeCourse = attendanceSession.course.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Attendance_${safeCourse}_${new Date(attendanceSession.createdAt).toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
