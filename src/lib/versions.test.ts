import { describe, expect, it } from "vitest";
import { latestVersion } from "./versions";

const latest = (versions: string[]) =>
  latestVersion(versions.map((version) => ({ version })))?.version;

describe("latestVersion", () => {
  it("picks the highest stable version over newer pre-releases", () => {
    expect(latest(["3.9.9", "3.10.0", "4.0.0-rc-7", "3.10.0-rc-1"])).toBe(
      "3.10.0",
    );
  });

  it("falls back to the highest pre-release when nothing is stable", () => {
    expect(latest(["4.0.0-beta-3", "4.0.0-beta-6", "4.0.0-beta-5"])).toBe(
      "4.0.0-beta-6",
    );
  });

  it("returns undefined for no versions", () => {
    expect(latest([])).toBeUndefined();
  });
});
