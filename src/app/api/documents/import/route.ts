import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { parseImportedFile, UnsupportedFileTypeError } from "@/lib/importFile";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB is plenty for .txt/.md source text

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File is larger than 2MB. Use a smaller text file." }, { status: 400 });
  }

  try {
    const content = await file.text();
    const { title, html } = parseImportedFile(file.name, content);

    const document = await prisma.document.create({
      data: { title, contentHtml: html, ownerId: userId },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to import file:", err);
    return NextResponse.json({ error: "Could not import the file." }, { status: 500 });
  }
}
