import { describe, expect, it } from "vitest";
import {
  MAX_QUERY_LENGTH,
  parseSearchParams,
  searchHref,
} from "./search-params";

describe("parseSearchParams", () => {
  it("trims the query and limits its length", () => {
    expect(parseSearchParams({ q: "  maven  " }).q).toBe("maven");
    expect(parseSearchParams({ q: "a".repeat(500) }).q).toHaveLength(
      MAX_QUERY_LENGTH,
    );
  });

  it("falls back to page 1 for missing or invalid pages", () => {
    for (const page of [undefined, "0", "-2", "1.5", "abc"]) {
      expect(parseSearchParams({ q: "maven", page }).page).toBe(1);
    }
    expect(parseSearchParams({ q: "maven", page: "3" }).page).toBe(3);
  });

  it("uses the first value of repeated parameters", () => {
    expect(parseSearchParams({ q: ["maven", "hiero"] }).q).toBe("maven");
  });
});

describe("searchHref", () => {
  it("omits the first page and encodes the query", () => {
    expect(searchHref({ q: "maven core", page: 1 })).toBe(
      "/search?q=maven+core",
    );
    expect(searchHref({ q: "maven", page: 2 })).toBe("/search?q=maven&page=2");
  });
});
