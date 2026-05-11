import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/admin/login",
  "/register",
  "/forgot-password",
  "/qrapi/auth/login",
  "/qrapi/auth/register",
  "/qrapi/auth/forgot-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  let session: SessionData & { isLoggedIn: boolean };
  try {
    const response = NextResponse.next();
    session = await getIronSession<SessionData>(request, response, sessionOptions);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!session.isLoggedIn) {
    if (pathname.startsWith("/qrapi/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/qrapi/admin") && session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (pathname.startsWith("/lecturer") && session.role !== "lecturer") {
    return NextResponse.redirect(
      session.role === "student"
        ? new URL("/student/dashboard", request.url)
        : new URL("/admin/dashboard", request.url)
    );
  }
  if (pathname.startsWith("/student") && session.role !== "student") {
    return NextResponse.redirect(
      session.role === "lecturer"
        ? new URL("/lecturer/dashboard", request.url)
        : new URL("/admin/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
