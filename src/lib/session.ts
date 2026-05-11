import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: number;
  role: "student" | "lecturer" | "admin";
  name: string;
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || "development-secret-development-secret-1234",
  cookieName: "qr_attendance_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session;
}
