import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [students, lecturers] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      select: { id: true, name: true, matricNo: true, createdAt: true },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "lecturer" },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return NextResponse.json({ students, lecturers });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, securityQuestion, securityAnswer } = await request.json();

    if (!name || !email || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email address already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: "lecturer",
        securityQuestion: securityQuestion.trim(),
        securityAnswer: hashedAnswer,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
