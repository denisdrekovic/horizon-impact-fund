import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/session";

export type AuthRole = "viewer" | "admin";

interface UserEntry {
  password: string;
  role: AuthRole;
}


function parseUsers(): Map<string, UserEntry> {
  const raw = process.env.AUTH_USERS ?? "";
  const map = new Map<string, UserEntry>();
  for (const pair of raw.split(",")) {
    const sep = pair.indexOf(":");
    if (sep < 1) continue;
    const username = pair.slice(0, sep).trim().toLowerCase();
    const password = pair.slice(sep + 1).trim();
    const role: AuthRole = username.startsWith("admin") ? "admin" : "viewer";
    map.set(username, { password, role });
  }
  return map;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required" },
      { status: 400 }
    );
  }

  const users = parseUsers();
  const user = users.get(username.trim().toLowerCase());
  if (!user || !safeEqual(password, user.password)) {
    return NextResponse.json(
      { success: false, error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.role = user.role;
  session.username = username.trim().toLowerCase();
  await session.save();

  return NextResponse.json({ success: true, role: user.role });
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    isLoggedIn: session.isLoggedIn,
    role: session.role ?? null,
  });
}
