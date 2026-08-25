import { describe, expect, it } from "vitest";
import { parseImportedFile, UnsupportedFileTypeError } from "../src/lib/importFile";

describe("parseImportedFile", () => {
  it("converts plain text paragraphs into <p> tags", () => {
    const result = parseImportedFile("my-report.txt", "First paragraph.\n\nSecond paragraph.");
    expect(result.title).toBe("my report");
    expect(result.html).toBe("<p>First paragraph.</p><p>Second paragraph.</p>");
  });

  it("escapes HTML special characters in plain text", () => {
    const result = parseImportedFile("notes.txt", "1 < 2 && 3 > 1");
    expect(result.html).toContain("&lt;");
    expect(result.html).toContain("&gt;");
    expect(result.html).not.toContain("<script");
  });

  it("converts markdown headings and bold text to HTML", () => {
    const result = parseImportedFile("guide.md", "# Heading\n\nText in **bold**.");
    expect(result.html).toContain("<h1>Heading</h1>");
    expect(result.html).toContain("<strong>bold</strong>");
  });

  it("falls back to a default title when the filename has no usable name", () => {
    const result = parseImportedFile(".txt", "content");
    expect(result.title).toBe("Imported document");
  });

  it("returns an empty paragraph for blank content instead of an empty string", () => {
    const result = parseImportedFile("blank.txt", "   \n\n   ");
    expect(result.html).toBe("<p></p>");
  });

  it("rejects unsupported file extensions", () => {
    expect(() => parseImportedFile("spreadsheet.xlsx", "data")).toThrow(UnsupportedFileTypeError);
  });

  it("rejects files without any extension", () => {
    expect(() => parseImportedFile("file", "data")).toThrow(UnsupportedFileTypeError);
  });
});
