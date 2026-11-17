import "server-only";

import { toVulnerabilityCounts } from "@/lib/data/artifacts";
import { getPortfolio, groupByArtifact } from "@/lib/data/portfolio";
import { dtGet } from "@/lib/dt/client";
import type { DtConciseProject } from "@/lib/dt/types";
import { purlType } from "@/lib/purl";
import type { VulnerabilityCounts } from "@/lib/severity";
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

/**
 * Report for the featured artifact: of the latest stable version of every
 * artifact, the one with the most dependencies. `null` if nothing is tracked.
 */
export async function getFeaturedPackageReport(): Promise<PackageReport | null> {
  const latestVersions = groupByArtifact(await getPortfolio()).flatMap(
    (versions) =>
      latestVersion(
        versions.map((project) => ({
          ...project,
          version: project.version ?? "",
        })),
      ) ?? [],
  );
  const featured = latestVersions.reduce<
    (typeof latestVersions)[number] | undefined
  >(
    (best, current) =>
      !best ||
      (current.metrics?.components ?? 0) > (best.metrics?.components ?? 0)
        ? current
        : best,
    undefined,
  );
  if (!featured) return null;

  const metrics = featured.metrics;
  const type = purlType(featured.purl);
  return {
    name: featured.name,
    version: featured.version,
    ecosystem: type ? ECOSYSTEMS[type] : undefined,
    importedAt: toIsoTimestamp(featured.lastBomImport),
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
