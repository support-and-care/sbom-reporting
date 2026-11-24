import { routes } from "@/config/site";
import { relevance } from "@/lib/relevance";
import { MAX_QUERY_LENGTH } from "@/lib/search-params";
import {
  SEVERITIES,
  SEVERITY_LABELS,
  totalVulnerabilities,
  type Severity,
  type VulnerabilityCounts,
} from "@/lib/severity";
import { compareVersions } from "@/lib/versions";

// Filtering, sorting and paging of a tracked project's artifact directory.
// Every entry is one released version of an artifact.

export const ARTIFACTS_PAGE_SIZE = 6;
const MOST_AFFECTED_LIMIT = 6;

export type ArtifactVersionEntry = {
  uuid: string;
  name: string;
  group?: string;
  version: string;
  /** Latest stable version of its artifact (see `latestVersion`). */
  isLatest: boolean;
  vulnerabilities: VulnerabilityCounts;
};

export type VersionFilter = "latest" | "older";
export type SeverityFilter = Severity | "none";

export const VERSION_FILTERS: readonly VersionFilter[] = ["latest", "older"];
export const SEVERITY_FILTERS: readonly SeverityFilter[] = [
  ...SEVERITIES,
  "none",
];

const VERSION_FILTER_LABELS: Record<VersionFilter, string> = {
  latest: "Latest",
  older: "Older",
};

const SEVERITY_FILTER_LABELS: Record<SeverityFilter, string> = {
  ...SEVERITY_LABELS,
  none: "None",
};

const KNOWN_ISSUES_LABEL = "Has known issues";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "name", label: "Name" },
  { value: "vulnerabilities", label: "Most vulnerabilities" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export type ArtifactQuery = {
  q: string;
  sort: SortOption;
  page: number;
  versions: VersionFilter[];
  severities: SeverityFilter[];
  /** Only versions with at least one known vulnerability. */
  knownIssues: boolean;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function values(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Allowed values in their canonical order, without duplicates. */
function pick<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T[] {
  const selected = new Set(values(value));
  return allowed.filter((option) => selected.has(option));
}

export function parseArtifactQuery(params: RawSearchParams): ArtifactQuery {
  const [sort] = pick(
    values(params.sort)[0],
    SORT_OPTIONS.map((option) => option.value),
  );
  const page = Number(values(params.page)[0]);
  return {
    q: (values(params.q)[0] ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    sort: sort ?? "relevance",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    versions: pick(params.version, VERSION_FILTERS),
    severities: pick(params.severity, SEVERITY_FILTERS),
    knownIssues: values(params.issues)[0] === "known",
  };
}

export function activeFilterCount(query: ArtifactQuery): number {
  return (
    query.versions.length +
    query.severities.length +
    (query.knownIssues ? 1 : 0)
  );
}

/** Page URL for the query; default values are left out. */
export function projectHref(slug: string, query: ArtifactQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort !== "relevance") params.set("sort", query.sort);
  for (const version of query.versions) params.append("version", version);
  for (const severity of query.severities) params.append("severity", severity);
  if (query.knownIssues) params.set("issues", "known");
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `${routes.project(slug)}?${search}` : routes.project(slug);
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/** Query with the filter switched on or off, back on the first page. */
export function toggleFilter(
  query: ArtifactQuery,
  filter: ArtifactFilter,
): ArtifactQuery {
  const next = { ...query, page: 1 };
  switch (filter.kind) {
    case "version":
      return {
        ...next,
        versions: VERSION_FILTERS.filter((v) =>
          toggle(query.versions, filter.value).includes(v),
        ),
      };
    case "severity":
      return {
        ...next,
        severities: SEVERITY_FILTERS.filter((s) =>
          toggle(query.severities, filter.value).includes(s),
        ),
      };
    case "knownIssues":
      return { ...next, knownIssues: !query.knownIssues };
  }
}

export function clearFilters(query: ArtifactQuery): ArtifactQuery {
  return {
    ...query,
    page: 1,
    versions: [],
    severities: [],
    knownIssues: false,
  };
}

export type ArtifactFilter =
  | { kind: "version"; value: VersionFilter }
  | { kind: "severity"; value: SeverityFilter }
  | { kind: "knownIssues" };

export function filterLabel(filter: ArtifactFilter): string {
  switch (filter.kind) {
    case "version":
      return VERSION_FILTER_LABELS[filter.value];
    case "severity":
      return SEVERITY_FILTER_LABELS[filter.value];
    case "knownIssues":
      return KNOWN_ISSUES_LABEL;
  }
}

export function isFilterActive(
  query: ArtifactQuery,
  filter: ArtifactFilter,
): boolean {
  switch (filter.kind) {
    case "version":
      return query.versions.includes(filter.value);
    case "severity":
      return query.severities.includes(filter.value);
    case "knownIssues":
      return query.knownIssues;
  }
}

/** Selected filters in display order. */
export function activeFilters(query: ArtifactQuery): ArtifactFilter[] {
  return [
    ...query.severities.map((value) => ({ kind: "severity", value }) as const),
    ...query.versions.map((value) => ({ kind: "version", value }) as const),
    ...(query.knownIssues ? [{ kind: "knownIssues" } as const] : []),
  ];
}

function hasKnownIssues(entry: ArtifactVersionEntry): boolean {
  return totalVulnerabilities(entry.vulnerabilities) > 0;
}

function matchesVersion(
  entry: ArtifactVersionEntry,
  filter: VersionFilter,
): boolean {
  return filter === "latest" ? entry.isLatest : !entry.isLatest;
}

function matchesSeverity(
  entry: ArtifactVersionEntry,
  filter: SeverityFilter,
): boolean {
  return filter === "none"
    ? !hasKnownIssues(entry)
    : entry.vulnerabilities[filter] > 0;
}

function matchesSearch(entry: ArtifactVersionEntry, q: string): boolean {
  if (!q) return true;
  const query = q.toLowerCase();
  return (
    entry.name.toLowerCase().includes(query) ||
    entry.version.toLowerCase().includes(query) ||
    (entry.group?.toLowerCase().includes(query) ?? false)
  );
}

export type FacetCounts = {
  versions: Record<VersionFilter, number>;
  severities: Record<SeverityFilter, number>;
  knownIssues: number;
};

/** How many entries each filter on its own would match. */
function facetCounts(entries: ArtifactVersionEntry[]): FacetCounts {
  const count = (predicate: (entry: ArtifactVersionEntry) => boolean) =>
    entries.filter(predicate).length;
  return {
    versions: {
      latest: count((e) => matchesVersion(e, "latest")),
      older: count((e) => matchesVersion(e, "older")),
    },
    severities: {
      critical: count((e) => matchesSeverity(e, "critical")),
      high: count((e) => matchesSeverity(e, "high")),
      medium: count((e) => matchesSeverity(e, "medium")),
      low: count((e) => matchesSeverity(e, "low")),
      none: count((e) => matchesSeverity(e, "none")),
    },
    knownIssues: count(hasKnownIssues),
  };
}

/** Newest version first among versions of the same artifact. */
function byNameThenNewest(
  a: ArtifactVersionEntry,
  b: ArtifactVersionEntry,
): number {
  return (
    a.name.localeCompare(b.name) ||
    (a.group ?? "").localeCompare(b.group ?? "") ||
    compareVersions(b.version, a.version)
  );
}

function bySeverity(a: ArtifactVersionEntry, b: ArtifactVersionEntry): number {
  const total =
    totalVulnerabilities(b.vulnerabilities) -
    totalVulnerabilities(a.vulnerabilities);
  if (total !== 0) return total;
  for (const severity of SEVERITIES) {
    const diff = b.vulnerabilities[severity] - a.vulnerabilities[severity];
    if (diff !== 0) return diff;
  }
  return 0;
}

function sortEntries(
  entries: ArtifactVersionEntry[],
  query: ArtifactQuery,
): ArtifactVersionEntry[] {
  const q = query.q.toLowerCase();
  const compare = {
    relevance: (a: ArtifactVersionEntry, b: ArtifactVersionEntry) =>
      (q ? relevance(a.name, q) - relevance(b.name, q) : 0) ||
      Number(b.isLatest) - Number(a.isLatest) ||
      byNameThenNewest(a, b),
    name: byNameThenNewest,
    vulnerabilities: (a: ArtifactVersionEntry, b: ArtifactVersionEntry) =>
      bySeverity(a, b) || byNameThenNewest(a, b),
  }[query.sort];
  return [...entries].sort(compare);
}

export type ArtifactDirectoryPage = {
  items: ArtifactVersionEntry[];
  /** Entries matching the search text, before filters; facets count these. */
  facets: FacetCounts;
  /** Entries matching the search text and filters. */
  total: number;
  page: number;
  pageCount: number;
  /** 1-based index of the first item shown, 0 if there are none. */
  firstIndex: number;
  lastIndex: number;
};

export function queryArtifactDirectory(
  entries: ArtifactVersionEntry[],
  query: ArtifactQuery,
  pageSize = ARTIFACTS_PAGE_SIZE,
): ArtifactDirectoryPage {
  const searched = entries.filter((entry) => matchesSearch(entry, query.q));
  // Within a filter group any option may match; across groups all must.
  const filtered = searched.filter(
    (entry) =>
      (query.versions.length === 0 ||
        query.versions.some((filter) => matchesVersion(entry, filter))) &&
      (query.severities.length === 0 ||
        query.severities.some((filter) => matchesSeverity(entry, filter))) &&
      (!query.knownIssues || hasKnownIssues(entry)),
  );

  const pageCount = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * pageSize;
  const items = sortEntries(filtered, query).slice(start, start + pageSize);

  return {
    items,
    facets: facetCounts(searched),
    total: filtered.length,
    page,
    pageCount,
    firstIndex: items.length > 0 ? start + 1 : 0,
    lastIndex: start + items.length,
  };
}

export type PageItem = number | "ellipsis";

/**
 * Page links to show: the first and last page, a window around the current
 * one, and ellipses for the gaps, e.g. `1 2 3 4 5 6 … 248` on page 1.
 */
export function pageItems(current: number, count: number): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index);

  if (count <= 8) return range(1, count);
  if (current <= 4) return [...range(1, 6), "ellipsis", count];
  if (current >= count - 3) return [1, "ellipsis", ...range(count - 5, count)];
  return [1, "ellipsis", ...range(current - 2, current + 2), "ellipsis", count];
}

export type ProjectVulnerabilitySummary = VulnerabilityCounts & {
  artifactCount: number;
  /** Artifacts whose latest version has at least one known vulnerability. */
  artifactsWithKnownIssues: number;
};

function latestEntries(
  entries: ArtifactVersionEntry[],
): ArtifactVersionEntry[] {
  return entries.filter((entry) => entry.isLatest);
}

/** Vulnerabilities across the latest version of every artifact. */
export function summarizeProject(
  entries: ArtifactVersionEntry[],
): ProjectVulnerabilitySummary {
  const latest = latestEntries(entries);
  const sum = (severity: Severity) =>
    latest.reduce((total, entry) => total + entry.vulnerabilities[severity], 0);
  return {
    critical: sum("critical"),
    high: sum("high"),
    medium: sum("medium"),
    low: sum("low"),
    artifactCount: latest.length,
    artifactsWithKnownIssues: latest.filter(hasKnownIssues).length,
  };
}

/** Latest versions with the most known vulnerabilities. */
export function mostAffectedArtifacts(
  entries: ArtifactVersionEntry[],
  limit = MOST_AFFECTED_LIMIT,
): ArtifactVersionEntry[] {
  return latestEntries(entries)
    .filter(hasKnownIssues)
    .sort((a, b) => bySeverity(a, b) || byNameThenNewest(a, b))
    .slice(0, limit);
}
