import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { step, role, identifier, answer, newPassword } = await request.json();

    if (!role || !identifier) {
      return NextResponse.json({ error: "Role and identifier are required" }, { status: 400 });
    }

    let user;
    if (role === "student") {
      user = await prisma.user.findUnique({ where: { matricNo: identifier.trim().toUpperCase() } });
    } else {
      user = await prisma.user.findUnique({ where: { email: identifier.trim().toLowerCase() } });
    }

    if (!user || user.role !== role) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!user.securityQuestion || !user.securityAnswer) {
      return NextResponse.json(
        { error: "No security question set for this account. Please contact your admin." },
        { status: 400 }
      );
    }

    if (step === "question") {
      return NextResponse.json({ question: user.securityQuestion });
    }

    if (step === "reset") {
      if (!answer || !newPassword) {
        return NextResponse.json({ error: "Answer and new password are required" }, { status: 400 });
      }

      const answerCorrect = await bcrypt.compare(answer.trim().toLowerCase(), user.securityAnswer);
      if (!answerCorrect) {
        return NextResponse.json({ error: "Incorrect answer" }, { status: 401 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
