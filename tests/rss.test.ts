import { describe, it, expect } from "vitest";

// Mirror the stripHtml function from src/lib/rss.ts
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim().slice(0, 1000);
}

// Mirror the deduplication logic
function deduplicateByUrl<T extends { url: string }>(articles: T[]): T[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

describe("RSS Processing", () => {
  describe("stripHtml", () => {
    it("removes simple HTML tags", () => {
      expect(stripHtml("<p>Hello world</p>")).toBe("Hello world");
    });

    it("removes nested tags", () => {
      expect(stripHtml("<div><b>Bold</b> text</div>")).toBe("Bold text");
    });

    it("removes self-closing tags", () => {
      expect(stripHtml("Line 1<br/>Line 2")).toBe("Line 1Line 2");
    });

    it("handles tags with attributes", () => {
      expect(stripHtml('<a href="https://example.com">link</a>')).toBe("link");
    });

    it("trims whitespace", () => {
      expect(stripHtml("  <p> hello </p>  ")).toBe("hello");
    });

    it("returns empty string for only tags", () => {
      expect(stripHtml("<br/><hr/>")).toBe("");
    });

    it("handles plain text without tags", () => {
      expect(stripHtml("no tags here")).toBe("no tags here");
    });

    it("truncates to 1000 characters", () => {
      const longText = "a".repeat(2000);
      expect(stripHtml(longText).length).toBe(1000);
    });

    it("handles empty string", () => {
      expect(stripHtml("")).toBe("");
    });

    it("handles HTML entities as plain text", () => {
      expect(stripHtml("&amp; &lt; &gt;")).toBe("&amp; &lt; &gt;");
    });
  });

  describe("deduplicateByUrl", () => {
    it("removes duplicate URLs", () => {
      const articles = [
        { url: "https://a.com/1", title: "First" },
        { url: "https://a.com/2", title: "Second" },
        { url: "https://a.com/1", title: "First Duplicate" },
      ];
      const result = deduplicateByUrl(articles);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("First");
      expect(result[1].title).toBe("Second");
    });

    it("keeps first occurrence", () => {
      const articles = [
        { url: "https://a.com/1", title: "Original" },
        { url: "https://a.com/1", title: "Duplicate" },
      ];
      const result = deduplicateByUrl(articles);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Original");
    });

    it("handles empty array", () => {
      expect(deduplicateByUrl([])).toHaveLength(0);
    });

    it("handles all unique", () => {
      const articles = [
        { url: "https://a.com/1" },
        { url: "https://a.com/2" },
        { url: "https://a.com/3" },
      ];
      expect(deduplicateByUrl(articles)).toHaveLength(3);
    });

    it("handles all duplicates", () => {
      const articles = [
        { url: "https://a.com/1" },
        { url: "https://a.com/1" },
        { url: "https://a.com/1" },
      ];
      expect(deduplicateByUrl(articles)).toHaveLength(1);
    });
  });
});
