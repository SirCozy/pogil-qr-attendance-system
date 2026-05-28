import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionData, sessionOptions } from "@/lib/session";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Safely parse request body
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
    }

    // Extract and validate fields
    const { role, identifier, password } = body;

    if (!role || !identifier || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let user;
    if (role === "student") {
      user = await prisma.user.findUnique({ where: { matricNo: identifier } });
    } else if (role === "lecturer" || role === "admin") {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!user || user.role !== role) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ role: user.role, name: user.name });
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    session.userId = user.id;
    session.role = user.role as SessionData["role"];
    session.name = user.name;
    session.isLoggedIn = true;
    await session.save();

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
