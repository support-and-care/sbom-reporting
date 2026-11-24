import "server-only";

import { toVulnerabilityCounts } from "@/lib/data/artifacts";
import { getPortfolio, groupByArtifact } from "@/lib/data/portfolio";
import { dtGet } from "@/lib/dt/client";
import type { DtConciseProject } from "@/lib/dt/types";
import { featuredSlot } from "@/lib/featured";
import { purlType } from "@/lib/purl";
import type { VulnerabilityCounts } from "@/lib/severity";
import { isStableVersion, latestVersion } from "@/lib/versions";

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

export type FeaturedPackages = {
  /** Rotation slot at request time, see `featuredSlot`. */
  slot: number;
  reports: PackageReport[];
};

/**
 * Reports of the artifacts the hero can feature: the latest release of every
 * artifact that has one and has known dependencies, in a stable order.
 */
export async function getFeaturedPackages(): Promise<FeaturedPackages> {
  const portfolio = await getPortfolio();
  // Reading the portfolio marks the request dynamic, so the clock may be read.
  const slot = featuredSlot(Date.now());
  const reports = groupByArtifact(portfolio).flatMap((versions) => {
    const latest = latestVersion(
      versions.map((project) => ({
        ...project,
        version: project.version ?? "",
      })),
    );
    if (
      !latest ||
      !isStableVersion(latest.version) ||
      !latest.metrics?.components
    ) {
      return [];
    }

    const metrics = latest.metrics;
    const type = purlType(latest.purl);
    return {
      name: latest.name,
      version: latest.version,
      ecosystem: type ? ECOSYSTEMS[type] : undefined,
      importedAt: toIsoTimestamp(latest.lastBomImport),
      dependencies: metrics.components ?? 0,
      vulnerableDependencies: metrics.vulnerableComponents ?? 0,
      vulnerabilities: metrics.vulnerabilities ?? 0,
      severity: toVulnerabilityCounts(metrics),
    };
  });
  return { slot, reports };
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
