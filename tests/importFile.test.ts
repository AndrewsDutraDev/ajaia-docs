import { describe, expect, it } from "vitest";
import { parseImportedFile, UnsupportedFileTypeError } from "../src/lib/importFile";

describe("parseImportedFile", () => {
  it("converts plain text paragraphs into <p> tags", () => {
    const result = parseImportedFile("meu-relatorio.txt", "Primeiro parágrafo.\n\nSegundo parágrafo.");
    expect(result.title).toBe("meu relatorio");
    expect(result.html).toBe("<p>Primeiro parágrafo.</p><p>Segundo parágrafo.</p>");
  });

  it("escapes HTML special characters in plain text", () => {
    const result = parseImportedFile("notas.txt", "1 < 2 && 3 > 1");
    expect(result.html).toContain("&lt;");
    expect(result.html).toContain("&gt;");
    expect(result.html).not.toContain("<script");
  });

  it("converts markdown headings and bold text to HTML", () => {
    const result = parseImportedFile("guia.md", "# Título\n\nTexto em **negrito**.");
    expect(result.html).toContain("<h1>Título</h1>");
    expect(result.html).toContain("<strong>negrito</strong>");
  });

  it("falls back to a default title when the filename has no usable name", () => {
    const result = parseImportedFile(".txt", "conteúdo");
    expect(result.title).toBe("Documento importado");
  });

  it("returns an empty paragraph for blank content instead of an empty string", () => {
    const result = parseImportedFile("vazio.txt", "   \n\n   ");
    expect(result.html).toBe("<p></p>");
  });

  it("rejects unsupported file extensions", () => {
    expect(() => parseImportedFile("planilha.xlsx", "dados")).toThrow(UnsupportedFileTypeError);
  });

  it("rejects files without any extension", () => {
    expect(() => parseImportedFile("arquivo", "dados")).toThrow(UnsupportedFileTypeError);
  });
});
