import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "ajaia_session";

/** Server components / route handlers: read the logged-in user id from the cookie jar. */
export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export function setSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
