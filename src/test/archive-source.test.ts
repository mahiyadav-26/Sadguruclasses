import { describe, it, expect } from "vitest";
import { isArchiveSource, isSheetsSource } from "../lib/pdfSourceKind";

describe("isArchiveSource", () => {
  it("matches archive.org sources", () => {
    expect(isArchiveSource("https://archive.org/details/Botany_Notes")).toBe(true);
    expect(isArchiveSource("https://ia801509.us.archive.org/12/items/x/x.pdf")).toBe(true);
    expect(isArchiveSource("https://x.supabase.co/functions/v1/pdf-proxy?kind=archive&id=Botany")).toBe(true);
    expect(isArchiveSource("https://x.supabase.co/functions/v1/pdf-proxy?kind=url&url=https%3A%2F%2Farchive.org%2Fdownload%2Fx%2Fx.pdf")).toBe(true);
  });

  it("does not match other sources", () => {
    expect(isArchiveSource("https://storage-naveenbharat-recording.vercel.app/view/abc")).toBe(false);
    expect(isArchiveSource("https://docs.google.com/spreadsheets/d/abc/export?format=pdf")).toBe(false);
    expect(isArchiveSource("https://x.supabase.co/functions/v1/pdf-proxy?kind=drive&id=abc")).toBe(false);
    expect(isArchiveSource("https://raw.githubusercontent.com/a/b/main/x.pdf")).toBe(false);
    expect(isArchiveSource(undefined)).toBe(false);
  });

  it("stays disjoint from the Sheets smart-fit path", () => {
    const sheets = "https://docs.google.com/spreadsheets/d/abc/export?format=pdf";
    expect(isSheetsSource(sheets)).toBe(true);
    expect(isArchiveSource(sheets)).toBe(false);
  });
});
