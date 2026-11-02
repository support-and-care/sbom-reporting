import "server-only";

import { featuredArtifact } from "@/content/landing";
import {
  toVulnerabilityCounts,
  type VulnerabilityCounts,
} from "@/lib/data/artifacts";
import { dtGet, dtGetAll } from "@/lib/dt/client";
import type { DtConciseProject, DtProject } from "@/lib/dt/types";
import { purlNamespace, purlType } from "@/lib/purl";
import { latestVersion } from "@/lib/versions";

const ECOSYSTEMS: Record<string, string> = {
  cargo: "Rust",
  composer: "PHP",
  gem: "Ruby",
  golang: "Go",
  maven: "Java",
  npm: "JavaScript",
  nuget: ".NET",
  pypi: "Python",
};

function toIsoTimestamp(
  epochMs: number | null | undefined,
): string | undefined {
  return epochMs ? new Date(epochMs).toISOString() : undefined;
}

export type PackageReport = {
  name: string;
  version: string;
  /** Language ecosystem derived from the Package URL, e.g. `Java`. */
  ecosystem?: string;
  /** ISO timestamp of the SBOM import this report is based on. */
  importedAt?: string;
  dependencies: number;
  vulnerableDependencies: number;
  vulnerabilities: number;
  severity: VulnerabilityCounts;
};

/** Report for the latest stable version of the featured artifact, or `null` if it isn't tracked. */
export async function getFeaturedPackageReport(): Promise<PackageReport | null> {
  const { items } = await dtGetAll<DtProject>("/v1/project", {
    name: featuredArtifact.name,
    excludeInactive: true,
  });
  const versions = items
    .filter(
      (project) =>
        project.name === featuredArtifact.name &&
        purlNamespace(project.purl) === featuredArtifact.purlNamespace,
    )
    .map((project) => ({ ...project, version: project.version ?? "" }));

  const latest = latestVersion(versions);
  if (!latest) return null;

  const metrics = latest.metrics;
  const type = purlType(latest.purl);
  return {
    name: latest.name,
    version: latest.version,
    ecosystem: type ? ECOSYSTEMS[type] : undefined,
    importedAt: toIsoTimestamp(latest.lastBomImport),
    dependencies: metrics?.components ?? 0,
    vulnerableDependencies: metrics?.vulnerableComponents ?? 0,
    vulnerabilities: metrics?.vulnerabilities ?? 0,
    severity: toVulnerabilityCounts(metrics),
  };
}

/** ISO timestamp of the most recent SBOM import, or `null` if nothing was imported yet. */
export async function getLatestSnapshotDate(): Promise<string | null> {
  const { data } = await dtGet<DtConciseProject[]>("/v1/project/concise", {
    sortName: "lastBomImport",
    sortOrder: "desc",
    pageNumber: 1,
    pageSize: 1,
  });
  return toIsoTimestamp(data?.[0]?.lastBomImport) ?? null;
}
