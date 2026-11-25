import { formatNumber } from "@/lib/format";
import { SEVERITIES, SEVERITY_LABELS, type Severity } from "@/lib/severity";
import { compareVersions } from "@/lib/versions";

// Data shapes and pure helpers of the artifact page, shared by the server
// (which builds them from Dependency-Track) and the interactive tables.

/** Severities of a finding: the four ratings plus findings without one. */
export type FindingSeverity = Severity | "unassigned";

/** Most to least severe, unassigned last. */
export const FINDING_SEVERITIES: readonly FindingSeverity[] = [
  ...SEVERITIES,
  "unassigned",
];

export const FINDING_SEVERITY_LABELS: Record<FindingSeverity, string> = {
  ...SEVERITY_LABELS,
  unassigned: "Unassigned",
};

export type SeverityCounts = Record<FindingSeverity, number>;

export function emptySeverityCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 };
}

export function totalOf(counts: SeverityCounts): number {
  return FINDING_SEVERITIES.reduce((sum, key) => sum + counts[key], 0);
}

/** Counts in words, most severe first, e.g. `["7 critical", "2 high"]`. */
export function describeSeverityCounts(counts: SeverityCounts): string[] {
  return FINDING_SEVERITIES.filter((severity) => counts[severity] > 0).map(
    (severity) => `${formatNumber(counts[severity])} ${severity}`,
  );
}

/** Versions affected by a vulnerability; a range without bounds covers all. */
export type AffectedRange = {
  version?: string;
  startIncluding?: string;
  startExcluding?: string;
  endIncluding?: string;
  endExcluding?: string;
};

export function isAffected(version: string, range: AffectedRange): boolean {
  const compare = (other: string) => compareVersions(version, other);
  if (range.version !== undefined) return compare(range.version) === 0;
  if (range.startIncluding && compare(range.startIncluding) < 0) return false;
  if (range.startExcluding && compare(range.startExcluding) <= 0) return false;
  if (range.endIncluding && compare(range.endIncluding) > 0) return false;
  if (range.endExcluding && compare(range.endExcluding) >= 0) return false;
  return true;
}

export type FixStatus =
  /** The range the version falls into ends before this version. */
  | { kind: "fixed"; version: string }
  /** No fixed version is listed, but the latest release is not affected. */
  | { kind: "upgrade"; version: string }
  | { kind: "none" };

/**
 * How a vulnerability in `version` can be fixed, judged by the affected
 * ranges of its advisory and the component's latest release.
 */
export function fixStatus(
  version: string,
  latest: string | undefined,
  ranges: readonly AffectedRange[],
): FixStatus {
  const [fixedIn] = ranges
    .filter((range) => isAffected(version, range))
    .flatMap((range) => (range.endExcluding ? [range.endExcluding] : []))
    .sort(compareVersions);
  if (fixedIn) return { kind: "fixed", version: fixedIn };

  if (
    latest &&
    ranges.length > 0 &&
    compareVersions(latest, version) > 0 &&
    !ranges.some((range) => isAffected(latest, range))
  ) {
    return { kind: "upgrade", version: latest };
  }
  return { kind: "none" };
}

export function fixLabel(status: FixStatus): string {
  switch (status.kind) {
    case "fixed":
      return `Fixed in ${status.version}`;
    case "upgrade":
      return "Fix available";
    case "none":
      return "No fix listed";
  }
}

const ADVISORY_SOURCES: Record<
  string,
  { label: string; url?: (id: string) => string }
> = {
  NVD: {
    label: "NVD",
    url: (id) => `https://nvd.nist.gov/vuln/detail/${id}`,
  },
  GITHUB: {
    label: "GitHub",
    url: (id) => `https://github.com/advisories/${id}`,
  },
  OSV: { label: "OSV", url: (id) => `https://osv.dev/vulnerability/${id}` },
  SNYK: { label: "Snyk", url: (id) => `https://security.snyk.io/vuln/${id}` },
  OSSINDEX: { label: "OSS Index" },
  VULNDB: { label: "VulnDB" },
  INTERNAL: { label: "Internal" },
};

/** Display name of a vulnerability database, e.g. `GITHUB` → `GitHub`. */
export function advisorySourceLabel(source: string): string {
  return ADVISORY_SOURCES[source]?.label ?? source;
}

/** Public advisory page of a vulnerability, if its database has one. */
export function advisoryUrl(source: string, id: string): string | undefined {
  return ADVISORY_SOURCES[source]?.url?.(encodeURIComponent(id));
}

export type Finding = {
  /** Unique per vulnerability and component. */
  key: string;
  vulnId: string;
  source: string;
  /** CVE of an advisory that is not itself a CVE, if one is assigned. */
  cve?: string;
  severity: FindingSeverity;
  component: { name: string; group?: string; version: string };
  sourceCodeUrl?: string;
};

/** Fix status of findings, by `Finding.key`. */
export type FixStatuses = Record<string, FixStatus>;

export type FindingQuery = {
  q: string;
  /** Empty for all severities. */
  severities: FindingSeverity[];
};

function matches(query: string, values: (string | undefined)[]): boolean {
  const needle = query.trim().toLowerCase();
  return (
    !needle ||
    values.some((value) => value?.toLowerCase().includes(needle) ?? false)
  );
}

export function filterFindings(
  findings: readonly Finding[],
  { q, severities }: FindingQuery,
): Finding[] {
  return findings.filter(
    (finding) =>
      (severities.length === 0 || severities.includes(finding.severity)) &&
      matches(q, [
        finding.vulnId,
        finding.cve,
        finding.component.name,
        finding.component.group,
      ]),
  );
}

/** Most severe first, then by component and id. */
export function compareFindings(a: Finding, b: Finding): number {
  return (
    FINDING_SEVERITIES.indexOf(a.severity) -
      FINDING_SEVERITIES.indexOf(b.severity) ||
    a.component.name.localeCompare(b.component.name) ||
    a.vulnId.localeCompare(b.vulnId)
  );
}

export function countBySeverity(
  findings: readonly Pick<Finding, "severity">[],
): SeverityCounts {
  const counts = emptySeverityCounts();
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}

export type Dependency = {
  key: string;
  name: string;
  group?: string;
  version: string;
  latestVersion?: string;
  /** SPDX id or declared name; `undefined` if the SBOM names none. */
  license?: string;
  sourceCodeUrl?: string;
  vulnerabilities: SeverityCounts;
  /** Artifact page of the dependency, if it is tracked itself. */
  href?: string;
};

/** Filter value of dependencies without a licence. */
export const UNKNOWN_LICENSE = "";

export type DependencyQuery = {
  q: string;
  /** Empty for all licences; `UNKNOWN_LICENSE` for none declared. */
  licenses: string[];
};

export function filterDependencies(
  dependencies: readonly Dependency[],
  { q, licenses }: DependencyQuery,
): Dependency[] {
  return dependencies.filter(
    (dependency) =>
      (licenses.length === 0 ||
        licenses.includes(dependency.license ?? UNKNOWN_LICENSE)) &&
      matches(q, [dependency.name, dependency.group]),
  );
}

/** Most vulnerable first, then by name. */
export function compareDependencies(a: Dependency, b: Dependency): number {
  return (
    totalOf(b.vulnerabilities) - totalOf(a.vulnerabilities) ||
    FINDING_SEVERITIES.reduce(
      (order, severity) =>
        order || b.vulnerabilities[severity] - a.vulnerabilities[severity],
      0,
    ) ||
    a.name.localeCompare(b.name) ||
    compareVersions(a.version, b.version)
  );
}

export type LicenseOption = { value: string; label: string; count: number };

/** Licences of the dependencies, most common first, unknown last. */
export function licenseOptions(
  dependencies: readonly Dependency[],
): LicenseOption[] {
  const counts = new Map<string, number>();
  for (const { license = UNKNOWN_LICENSE } of dependencies) {
    counts.set(license, (counts.get(license) ?? 0) + 1);
  }
  return [...counts]
    .map(([value, count]) => ({
      value,
      label: value === UNKNOWN_LICENSE ? "Not declared" : value,
      count,
    }))
    .sort(
      (a, b) =>
        Number(a.value === UNKNOWN_LICENSE) -
          Number(b.value === UNKNOWN_LICENSE) ||
        b.count - a.count ||
        a.label.localeCompare(b.label),
    );
}

export type Page<T> = {
  items: T[];
  page: number;
  pageCount: number;
  /** 1-based position of the first item shown, 0 if there are none. */
  firstIndex: number;
  lastIndex: number;
};

/** One page of `items`; pages past the end show the last page. */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): Page<T> {
  const pageCount = Math.max(Math.ceil(items.length / pageSize), 1);
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = (current - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    items: pageItems,
    page: current,
    pageCount,
    firstIndex: pageItems.length > 0 ? start + 1 : 0,
    lastIndex: start + pageItems.length,
  };
}

/** SBOM formats offered for download, with their labels. */
export const SBOM_FORMATS = {
  json: "CycloneDX JSON",
  xml: "CycloneDX XML",
} as const;

export type SbomFormat = keyof typeof SBOM_FORMATS;

export function isSbomFormat(value: string): value is SbomFormat {
  return Object.hasOwn(SBOM_FORMATS, value);
}

/** Format whose file size the page shows next to the download. */
export const SBOM_SIZE_FORMAT: SbomFormat = "json";

/** File size for people, e.g. `212 KB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
