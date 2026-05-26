import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, matricNo, password, code, securityQuestion, securityAnswer } =
      await request.json();

    if (!name || !matricNo || !password || !code || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const regCode = await prisma.registrationCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!regCode) {
      return NextResponse.json({ error: "Invalid registration code" }, { status: 400 });
    }
    if (regCode.usedAt) {
      return NextResponse.json({ error: "Registration code has already been used" }, { status: 400 });
    }
    if (new Date() > regCode.expiresAt) {
      return NextResponse.json({ error: "Registration code has expired" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { matricNo: matricNo.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Matric number already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        matricNo: matricNo.trim().toUpperCase(),
        password: hashedPassword,
        role: "student",
        securityQuestion: securityQuestion.trim(),
        securityAnswer: hashedAnswer,
      },
    });

    await prisma.registrationCode.update({
      where: { id: regCode.id },
      data: { usedAt: new Date(), usedById: user.id },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
