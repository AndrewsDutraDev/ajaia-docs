import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const [owned, sharedWithMe] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, createdAt: true },
    }),
    prisma.share.findMany({
      where: { userId },
      orderBy: { document: { updatedAt: "desc" } },
      select: {
        role: true,
        document: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            createdAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    owned,
    shared: sharedWithMe.map((s) => ({ ...s.document, role: s.role, owner: s.document.owner })),
  });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  contentHtml: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data." }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      title: parsed.data.title?.trim() || "Untitled document",
      contentHtml: parsed.data.contentHtml ?? "<p></p>",
      ownerId: userId,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
