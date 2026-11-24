import { describe, expect, it } from "vitest";
import { FEATURED_ROTATION_MS, featuredIndex, featuredSlot } from "./featured";

describe("featuredSlot", () => {
  it("stays the same within a rotation period", () => {
    const start = 1_700_000_000_000;
    expect(featuredSlot(start)).toBe(
      featuredSlot(start + FEATURED_ROTATION_MS - 1),
    );
    expect(featuredSlot(start + FEATURED_ROTATION_MS)).toBe(
      featuredSlot(start) + 1,
    );
  });
});

describe("featuredIndex", () => {
  it("is deterministic and within range", () => {
    for (let slot = 0; slot < 1_000; slot++) {
      const index = featuredIndex(slot, 7);
      expect(index).toBe(featuredIndex(slot, 7));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(7);
    }
  });

  it.each([2, 3, 7, 69])(
    "changes between consecutive slots and reaches all %i candidates",
    (count) => {
      const seen = new Set<number>();
      for (let slot = 0; slot < 10_000; slot++) {
        seen.add(featuredIndex(slot, count));
        expect(featuredIndex(slot, count)).not.toBe(
          featuredIndex(slot - 1, count),
        );
      }
      expect(seen.size).toBe(count);
    },
  );

  it("handles a single candidate", () => {
    expect(featuredIndex(42, 1)).toBe(0);
  });
});
