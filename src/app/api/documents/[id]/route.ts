import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { canEdit, resolveAccess } from "@/lib/access";

async function loadDocWithAccess(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: { shares: { select: { userId: true, role: true } }, owner: { select: { name: true, email: true } } },
  });
  if (!document) return { document: null, role: null } as const;
  const role = resolveAccess(document, userId);
  return { document, role } as const;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const { document, role } = await loadDocWithAccess(id, userId);
  if (!document || !role) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });

  return NextResponse.json({ document, role });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  contentHtml: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const { document, role } = await loadDocWithAccess(id, userId);
  if (!document || !role) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (!canEdit(role)) return NextResponse.json({ error: "Você não tem permissão para editar este documento." }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const { document, role } = await loadDocWithAccess(id, userId);
  if (!document || !role) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (role !== "OWNER") return NextResponse.json({ error: "Somente o dono pode excluir este documento." }, { status: 403 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
