import "server-only";

import { dtGetAll } from "@/lib/dt/client";
import type { DtConciseProject, DtProjectMetrics } from "@/lib/dt/types";
import type { ArtifactSuggestion } from "@/lib/suggestions";
import { latestVersion } from "@/lib/versions";

// Dependency-Track stores every released version of an artifact as its own
// project, so projects are grouped by artifact here.

const RESULTS_PAGE_SIZE = 20;

/** Identifies an artifact across all of its versions. */
export function artifactKey(project: {
  name: string;
  group?: string | null;
}): string {
  return `${project.group ?? ""}:${project.name}`;
}

export type VulnerabilityCounts = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type ArtifactVersion = {
  uuid: string;
  version: string;
  vulnerabilities: VulnerabilityCounts;
};

export type ArtifactSearchResult = {
  name: string;
  group?: string;
  latest: ArtifactVersion;
  versionCount: number;
};

export type ArtifactSearchPage = {
  items: ArtifactSearchResult[];
  totalArtifacts: number;
  page: number;
  pageCount: number;
  /** More versions matched than were fetched; results may be incomplete. */
  truncated: boolean;
};

function toVulnerabilityCounts(
  metrics: DtProjectMetrics | null | undefined,
): VulnerabilityCounts {
  return {
    critical: metrics?.critical ?? 0,
    high: metrics?.high ?? 0,
    medium: metrics?.medium ?? 0,
    low: metrics?.low ?? 0,
  };
}

function groupByArtifact(projects: DtConciseProject[]): ArtifactSearchResult[] {
  const artifacts = new Map<
    string,
    { name: string; group?: string; versions: ArtifactVersion[] }
  >();

  for (const project of projects) {
    const group = project.group ?? undefined;
    const key = artifactKey(project);
    const artifact = artifacts.get(key) ?? {
      name: project.name,
      group,
      versions: [],
    };
    artifact.versions.push({
      uuid: project.uuid,
      version: project.version ?? "",
      vulnerabilities: toVulnerabilityCounts(project.metrics),
    });
    artifacts.set(key, artifact);
  }

  return [...artifacts.values()].flatMap(({ name, group, versions }) => {
    const latest = latestVersion(versions);
    return latest
      ? [{ name, group, latest, versionCount: versions.length }]
      : [];
  });
}

/** Exact name matches first, then prefix matches, then alphabetical. */
function relevance(name: string, query: string): number {
  const normalized = name.toLowerCase();
  if (normalized === query) return 0;
  if (normalized.startsWith(query)) return 1;
  return 2;
}

function rankArtifacts(
  projects: DtConciseProject[],
  query: string,
): ArtifactSearchResult[] {
  const normalizedQuery = query.toLowerCase();
  return groupByArtifact(projects).sort(
    (a, b) =>
      relevance(a.name, normalizedQuery) - relevance(b.name, normalizedQuery) ||
      a.name.localeCompare(b.name),
  );
}

export async function searchArtifacts(
  query: string,
  page: number,
): Promise<ArtifactSearchPage> {
  const { items: projects, truncated } = await dtGetAll<DtConciseProject>(
    "/v1/project/concise",
    {
      searchText: query,
      sortName: "name",
      sortOrder: "asc",
      includeMetrics: true,
    },
  );
  const artifacts = rankArtifacts(projects, query);

  const pageCount = Math.max(
    Math.ceil(artifacts.length / RESULTS_PAGE_SIZE),
    1,
  );
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * RESULTS_PAGE_SIZE;

  return {
    items: artifacts.slice(start, start + RESULTS_PAGE_SIZE),
    totalArtifacts: artifacts.length,
    page: currentPage,
    pageCount,
    truncated,
  };
}

/** Best matching artifacts for type-ahead, from the first page of matches only. */
export async function suggestArtifacts(
  query: string,
  limit: number,
): Promise<ArtifactSuggestion[]> {
  const { items: projects } = await dtGetAll<DtConciseProject>(
    "/v1/project/concise",
    { searchText: query, sortName: "name", sortOrder: "asc" },
    { maxPages: 1 },
  );
  return rankArtifacts(projects, query)
    .slice(0, limit)
    .map(({ name, group, latest }) => ({
      name,
      group,
      latestVersion: latest.version,
    }));
}
