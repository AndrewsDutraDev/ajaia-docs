import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
});

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const words = local.replace(/[._-]+/g, " ").trim().split(" ");
  return words.map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { email } = parsed.data;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: nameFromEmail(email) },
  });

  const res = NextResponse.json({ user });
  setSessionCookie(res, user.id);
  return res;
}
