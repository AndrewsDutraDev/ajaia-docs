import { NextRequest, NextResponse } from "next/server";
import TurndownService from "turndown";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { canView, resolveAccess } from "@/lib/access";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "document";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    select: { title: true, contentHtml: true, ownerId: true, shares: { select: { userId: true, role: true } } },
  });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const role = resolveAccess(document, userId);
  if (!canView(role)) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format");
  if (format !== "md") {
    return NextResponse.json({ error: "Unsupported export format. Use format=md." }, { status: 400 });
  }

  const body = turndown.turndown(document.contentHtml).trim();
  // Avoid a duplicate heading when the content already opens with an H1 (e.g. imported files, or docs that repeat their title).
  const alreadyHasTitleHeading = new RegExp(`^#\\s+${document.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(
    body.split("\n").slice(0, 1).join("\n")
  );
  const markdown = `${alreadyHasTitleHeading ? "" : `# ${document.title}\n\n`}${body}\n`;
  const filename = `${slugify(document.title)}.md`;

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
