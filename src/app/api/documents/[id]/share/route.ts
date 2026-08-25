import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { resolveAccess } from "@/lib/access";

async function requireOwner(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } } },
  });
  if (!document) return { document: null, isOwner: false } as const;
  const role = resolveAccess(document, userId);
  return { document, isOwner: role === "OWNER" } as const;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const { document, isOwner } = await requireOwner(id, userId);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!isOwner) return NextResponse.json({ error: "Only the owner can view sharing settings." }, { status: 403 });

  const shares = await prisma.share.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ shares });
}

const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  role: z.enum(["VIEW", "EDIT"]).default("VIEW"),
});

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const words = local.replace(/[._-]+/g, " ").trim().split(" ");
  return words.map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const { document, isOwner } = await requireOwner(id, userId);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!isOwner) return NextResponse.json({ error: "Only the owner can share this document." }, { status: 403 });

  const parsed = shareSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data." }, { status: 400 });
  }

  const { email, role } = parsed.data;

  if (email === (await prisma.user.findUnique({ where: { id: userId } }))?.email) {
    return NextResponse.json({ error: "You're already the owner of this document." }, { status: 400 });
  }

  const targetUser = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: nameFromEmail(email) },
  });

  const share = await prisma.share.upsert({
    where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    update: { role },
    create: { documentId: id, userId: targetUser.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ share }, { status: 201 });
}

const deleteSchema = z.object({ userId: z.string().min(1) });

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const { document, isOwner } = await requireOwner(id, userId);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!isOwner) return NextResponse.json({ error: "Only the owner can remove access." }, { status: 403 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please specify which user to remove." }, { status: 400 });
  }

  await prisma.share.deleteMany({ where: { documentId: id, userId: parsed.data.userId } });
  return NextResponse.json({ ok: true });
}
