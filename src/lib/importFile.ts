import { marked } from "marked";

export const SUPPORTED_IMPORT_EXTENSIONS = [".txt", ".md"] as const;

export class UnsupportedFileTypeError extends Error {
  constructor(extension: string) {
    super(
      `File type "${extension}" is not supported. Only ${SUPPORTED_IMPORT_EXTENSIONS.join(", ")} can be imported.`
    );
    this.name = "UnsupportedFileTypeError";
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function titleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  const spaced = withoutExtension.replace(/[-_]+/g, " ").trim();
  return spaced.length > 0 ? spaced : "Imported document";
}

function plainTextToHtml(text: string): string {
  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return "<p></p>";

  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\r?\n/g, "<br/>")}</p>`)
    .join("");
}

export interface ParsedImport {
  title: string;
  html: string;
}

/** Pure function: converts an uploaded .txt or .md file's raw text into a new document's title + HTML body. */
export function parseImportedFile(filename: string, content: string): ParsedImport {
  const match = filename.match(/\.[^/.]+$/);
  const extension = (match?.[0] ?? "").toLowerCase();

  if (!SUPPORTED_IMPORT_EXTENSIONS.includes(extension as (typeof SUPPORTED_IMPORT_EXTENSIONS)[number])) {
    throw new UnsupportedFileTypeError(extension || "(no extension)");
  }

  const title = titleFromFilename(filename);
  const html = extension === ".md" ? (marked.parse(content, { async: false }) as string) : plainTextToHtml(content);

  return { title, html: html.trim().length > 0 ? html : "<p></p>" };
}
