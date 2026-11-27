import { describe, expect, it } from "vitest";
import {
  advisorySourceLabel,
  advisoryUrl,
  compareDependencies,
  dependencySeverityCounts,
  countBySeverity,
  describeSeverityCounts,
  emptySeverityCounts,
  filterDependencies,
  filterFindings,
  fixLabel,
  fixStatus,
  formatFileSize,
  isAffected,
  isSbomFormat,
  licenseOptions,
  paginate,
  UNKNOWN_LICENSE,
  type Dependency,
  type Finding,
} from "./artifact";

function finding(
  vulnId: string,
  severity: Finding["severity"],
  component: string,
  cve?: string,
): Finding {
  return {
    key: `${vulnId}:${component}`,
    vulnId,
    source: "GITHUB",
    cve,
    severity,
    component: { name: component, group: "org.example", version: "1.0" },
  };
}

function dependency(
  name: string,
  license: string | undefined,
  [critical, high, medium, low] = [0, 0, 0, 0],
): Dependency {
  return {
    key: name,
    name,
    version: "1.0",
    license,
    vulnerabilities: { ...emptySeverityCounts(), critical, high, medium, low },
  };
}

describe("isAffected", () => {
  it("checks every bound of a range", () => {
    const range = { startIncluding: "4.0.0", endExcluding: "4.0.3" };
    expect(isAffected("4.0.0", range)).toBe(true);
    expect(isAffected("4.0.2", range)).toBe(true);
    expect(isAffected("4.0.3", range)).toBe(false);
    expect(isAffected("3.9.9", range)).toBe(false);
    expect(isAffected("1.9.18", { endIncluding: "1.9.18" })).toBe(true);
    expect(isAffected("1.9.18", { startExcluding: "1.9.18" })).toBe(false);
  });

  it("compares versions numerically and matches exact versions", () => {
    expect(isAffected("1.10.0", { endExcluding: "1.9.0" })).toBe(false);
    expect(isAffected("2.0", { version: "2.0" })).toBe(true);
    expect(isAffected("2.1", { version: "2.0" })).toBe(false);
  });
});

describe("fixStatus", () => {
  const ranges = [
    { startIncluding: "4.0.0", endExcluding: "4.0.3" },
    { endExcluding: "3.6.1" },
  ];

  it("names the version that ends the matching range", () => {
    expect(fixStatus("4.0.2", "4.2.0", ranges)).toEqual({
      kind: "fixed",
      version: "4.0.3",
    });
    expect(fixLabel(fixStatus("3.5.0", undefined, ranges))).toBe(
      "Fixed in 3.6.1",
    );
  });

  it("offers the latest release when it is not affected", () => {
    const open = [{ startIncluding: "1.0" }, { version: "2.0" }];
    expect(fixStatus("2.0", "2.1", [{ version: "2.0" }])).toEqual({
      kind: "upgrade",
      version: "2.1",
    });
    expect(fixLabel(fixStatus("2.0", "2.1", open))).toBe("No fix listed");
  });

  it("lists no fix without range data", () => {
    expect(fixStatus("1.0", "2.0", [])).toEqual({ kind: "none" });
  });
});

describe("advisories", () => {
  it("labels databases and links advisories", () => {
    expect(advisorySourceLabel("GITHUB")).toBe("GitHub");
    expect(advisorySourceLabel("SOMETHING")).toBe("SOMETHING");
    expect(advisoryUrl("NVD", "CVE-2024-1")).toBe(
      "https://nvd.nist.gov/vuln/detail/CVE-2024-1",
    );
    expect(advisoryUrl("OSV", "PYSEC-2026-1")).toBe(
      "https://osv.dev/vulnerability/PYSEC-2026-1",
    );
    expect(advisoryUrl("VULNDB", "1")).toBeUndefined();
  });
});

describe("filterFindings", () => {
  const findings = [
    finding("GHSA-1", "critical", "plexus-utils", "CVE-2025-1"),
    finding("GHSA-2", "high", "guava"),
    finding("CVE-2024-9", "unassigned", "guava"),
  ];

  it("searches ids, CVE aliases and components", () => {
    const keys = (q: string) =>
      filterFindings(findings, { q, severities: [] }).map((f) => f.vulnId);
    expect(keys("cve-2025")).toEqual(["GHSA-1"]);
    expect(keys(" GUAVA ")).toEqual(["GHSA-2", "CVE-2024-9"]);
    expect(keys("org.example")).toHaveLength(3);
  });

  it("filters by any of the chosen severities", () => {
    const result = filterFindings(findings, {
      q: "",
      severities: ["critical", "unassigned"],
    });
    expect(result.map((f) => f.vulnId)).toEqual(["GHSA-1", "CVE-2024-9"]);
    expect(countBySeverity(findings)).toMatchObject({
      critical: 1,
      high: 1,
      unassigned: 1,
    });
  });
});

describe("dependencies", () => {
  const dependencies = [
    dependency("guava", "Apache-2.0", [0, 1, 1, 1]),
    dependency("plexus", "Apache-2.0", [1, 0, 0, 0]),
    dependency("bcprov", "Bouncy Castle Licence", [0, 2, 0, 0]),
    dependency("classworlds", undefined),
  ];

  it("sorts by total, then by severity", () => {
    expect(
      [...dependencies].sort(compareDependencies).map((d) => d.name),
    ).toEqual(["guava", "bcprov", "plexus", "classworlds"]);
  });

  it("offers licences by frequency with undeclared last", () => {
    expect(licenseOptions(dependencies)).toEqual([
      { value: "Apache-2.0", label: "Apache-2.0", count: 2 },
      {
        value: "Bouncy Castle Licence",
        label: "Bouncy Castle Licence",
        count: 1,
      },
      { value: UNKNOWN_LICENSE, label: "Not declared", count: 1 },
    ]);
  });

  it("filters by licence and name", () => {
    const names = (q: string, licenses: string[]) =>
      filterDependencies(dependencies, { q, severities: [], licenses }).map(
        (d) => d.name,
      );
    expect(names("", [UNKNOWN_LICENSE])).toEqual(["classworlds"]);
    expect(names("p", ["Apache-2.0"])).toEqual(["plexus"]);
  });
});

describe("dependency severity filter", () => {
  const dependencies = [
    dependency("guava", "Apache-2.0", [0, 1, 1, 1]),
    dependency("plexus", "Apache-2.0", [1, 0, 0, 0]),
    dependency("bcprov", "Bouncy Castle Licence", [0, 2, 0, 0]),
    dependency("classworlds", undefined),
  ];
  const names = (
    severities: Parameters<typeof filterDependencies>[1]["severities"],
    licenses: string[] = [],
  ) =>
    filterDependencies(dependencies, { q: "", severities, licenses }).map(
      (d) => d.name,
    );

  it("keeps dependencies with any chosen severity", () => {
    expect(names(["high"])).toEqual(["guava", "bcprov"]);
    expect(names(["critical", "low"])).toEqual(["guava", "plexus"]);
  });

  it("keeps dependencies without findings for None", () => {
    expect(names(["none"])).toEqual(["classworlds"]);
    expect(names(["none", "critical"])).toEqual(["plexus", "classworlds"]);
  });

  it("combines with the licence filter", () => {
    expect(names(["high"], ["Apache-2.0"])).toEqual(["guava"]);
  });

  it("counts dependencies per option", () => {
    expect(dependencySeverityCounts(dependencies)).toEqual({
      critical: 1,
      high: 2,
      medium: 1,
      low: 1,
      unassigned: 0,
      none: 1,
    });
  });
});

describe("paginate", () => {
  it("pages items and clamps the page", () => {
    const items = Array.from({ length: 23 }, (_, index) => index);
    expect(paginate(items, 3, 10)).toMatchObject({
      items: [20, 21, 22],
      page: 3,
      pageCount: 3,
      firstIndex: 21,
      lastIndex: 23,
    });
    expect(paginate(items, 9, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toMatchObject({
      pageCount: 1,
      firstIndex: 0,
      lastIndex: 0,
    });
  });
});

describe("formatFileSize", () => {
  it("rounds to a readable unit", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(217_000)).toBe("212 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("describeSeverityCounts", () => {
  it("lists non-zero counts, most severe first", () => {
    expect(
      describeSeverityCounts({
        ...emptySeverityCounts(),
        critical: 7,
        medium: 1200,
        unassigned: 2,
      }),
    ).toEqual(["7 critical", "1,200 medium", "2 unassigned"]);
    expect(describeSeverityCounts(emptySeverityCounts())).toEqual([]);
  });
});

describe("isSbomFormat", () => {
  it("accepts only the offered formats", () => {
    expect(isSbomFormat("json")).toBe(true);
    expect(isSbomFormat("xml")).toBe(true);
    expect(isSbomFormat("pdf")).toBe(false);
    expect(isSbomFormat("toString")).toBe(false);
  });
});
