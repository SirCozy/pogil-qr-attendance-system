import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await prisma.registrationCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      usedBy: { select: { name: true, matricNo: true } },
    },
  });

  return NextResponse.json(codes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { expiryHours } = await request.json();
  const hours = Number(expiryHours) || 24;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);

  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const exists = await prisma.registrationCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
    attempts++;
  }

  const newCode = await prisma.registrationCode.create({
    data: {
      code,
      expiresAt,
      createdBy: session.userId,
    },
  });

  return NextResponse.json(newCode, { status: 201 });
}
