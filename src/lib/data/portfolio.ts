import "server-only";

import { connection } from "next/server";
import { artifactKey } from "@/lib/data/artifacts";
import { dtGetAll } from "@/lib/dt/client";
import type { DtProject } from "@/lib/dt/types";

// Every Dependency-Track project (one per artifact version), shared by the
// landing page and the project pages. Fetching the full list takes several
// seconds, so it is kept in memory and refreshed in the background.

/** Up to 5,000 Dependency-Track projects. */
const MAX_PROJECT_PAGES = 50;
/** How long the list is served without refreshing it. */
const FRESH_MS = 5 * 60 * 1000;

export type PortfolioProject = Pick<
  DtProject,
  "uuid" | "name" | "group" | "version" | "purl" | "lastBomImport" | "metrics"
>;

type Snapshot = { projects: PortfolioProject[]; fetchedAt: number };

let snapshot: Snapshot | undefined;
let refreshing: Promise<Snapshot> | undefined;

/** Keeps only the fields the app reads; full projects are large. */
function toPortfolioProject(project: DtProject): PortfolioProject {
  const { uuid, name, group, version, purl, lastBomImport, metrics } = project;
  return {
    uuid,
    name,
    group,
    version,
    purl,
    lastBomImport,
    metrics: metrics && {
      critical: metrics.critical,
      high: metrics.high,
      medium: metrics.medium,
      low: metrics.low,
      components: metrics.components,
      vulnerableComponents: metrics.vulnerableComponents,
      vulnerabilities: metrics.vulnerabilities,
    },
  };
}

function refresh(): Promise<Snapshot> {
  refreshing ??= dtGetAll<DtProject>(
    "/v1/project",
    {},
    // Runs outside the request that triggered it when served stale.
    { maxPages: MAX_PROJECT_PAGES, dynamic: false },
  )
    .then(({ items, truncated }) => {
      if (truncated) {
        console.warn(
          `[portfolio] Only the first ${items.length} Dependency-Track projects were loaded.`,
        );
      }
      snapshot = {
        projects: items.map(toPortfolioProject),
        fetchedAt: Date.now(),
      };
      return snapshot;
    })
    .finally(() => {
      refreshing = undefined;
    });
  return refreshing;
}

export async function getPortfolio(): Promise<PortfolioProject[]> {
  // Report data is read at request time, never baked in at build time.
  await connection();

  if (!snapshot) return (await refresh()).projects;

  if (Date.now() - snapshot.fetchedAt > FRESH_MS) {
    // Serve the stale list right away; keep it if the refresh fails.
    refresh().catch((error) =>
      console.error("[portfolio] Background refresh failed:", error),
    );
  }
  return snapshot.projects;
}

/** Versions grouped by artifact, artifacts with the most versions first. */
export function groupByArtifact(
  projects: PortfolioProject[],
): PortfolioProject[][] {
  const artifacts = new Map<string, PortfolioProject[]>();
  for (const project of projects) {
    const key = artifactKey(project);
    artifacts.set(key, [...(artifacts.get(key) ?? []), project]);
  }
  return [...artifacts.values()].sort(
    (a, b) => b.length - a.length || a[0].name.localeCompare(b[0].name),
  );
}

/** A real artifact name to show as a search example, or `undefined` if none is tracked. */
export async function getExampleArtifactName(): Promise<string | undefined> {
  return groupByArtifact(await getPortfolio())[0]?.[0].name;
}
