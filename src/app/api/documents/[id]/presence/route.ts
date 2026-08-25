import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { canView, resolveAccess } from "@/lib/access";

const ACTIVE_WINDOW_MS = 12_000;

async function checkAccess(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    select: { ownerId: true, shares: { select: { userId: true, role: true } } },
  });
  if (!document) return null;
  return resolveAccess(document, userId);
}

/** Heartbeat: marks the current user as viewing this document, returns everyone else who's currently active. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const role = await checkAccess(id, userId);
  if (!canView(role)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  // `update: {}` alone doesn't reliably touch the @updatedAt column on every heartbeat — set it explicitly.
  await prisma.presence.upsert({
    where: { documentId_userId: { documentId: id, userId } },
    update: { lastSeenAt: new Date() },
    create: { documentId: id, userId },
  });

  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const active = await prisma.presence.findMany({
    where: { documentId: id, lastSeenAt: { gte: since } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    viewers: active.map((p) => ({ ...p.user, isSelf: p.user.id === userId })),
  });
}

/** Best-effort "I left the document" signal, sent on unmount/tab close. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.presence.deleteMany({ where: { documentId: id, userId } });
  return NextResponse.json({ ok: true });
}
