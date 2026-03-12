import { describe, it, expect } from "vitest";
import { RSS_FEEDS } from "@/lib/config";

describe("Config", () => {
  describe("RSS_FEEDS", () => {
    it("has feeds configured", () => {
      expect(RSS_FEEDS.length).toBeGreaterThan(0);
    });

    it("every feed has required fields", () => {
      for (const feed of RSS_FEEDS) {
        expect(feed.name).toBeTruthy();
        expect(feed.url).toBeTruthy();
        expect(feed.source).toBeTruthy();
      }
    });

    it("every feed URL is a valid URL", () => {
      for (const feed of RSS_FEEDS) {
        expect(() => new URL(feed.url)).not.toThrow();
      }
    });

    it("every feed URL uses HTTPS", () => {
      for (const feed of RSS_FEEDS) {
        const url = new URL(feed.url);
        expect(url.protocol).toBe("https:");
      }
    });

    it("no duplicate feed URLs", () => {
      const urls = RSS_FEEDS.map((f) => f.url);
      const unique = new Set(urls);
      expect(unique.size).toBe(urls.length);
    });

    it("no duplicate feed names", () => {
      const names = RSS_FEEDS.map((f) => f.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });
});
