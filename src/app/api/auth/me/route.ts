import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({ user });
}
