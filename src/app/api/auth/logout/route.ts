import { NextRequest, NextResponse } from "next/server";
import { SessionData, sessionOptions } from "@/lib/session";
import { getIronSession } from "iron-session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  session.destroy();
  return response;
}
