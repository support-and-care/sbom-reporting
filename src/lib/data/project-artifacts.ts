import "server-only";

import {
  trackedProjects,
  type TrackedProjectDefinition,
} from "@/config/tracked-projects";
import { toVulnerabilityCounts } from "@/lib/data/artifacts";
import { getPortfolio, groupByArtifact } from "@/lib/data/portfolio";
import { belongsTo } from "@/lib/data/projects";
import type { ArtifactVersionEntry } from "@/lib/project-artifacts";
import { latestVersion } from "@/lib/versions";

export function findTrackedProject(
  slug: string,
): TrackedProjectDefinition | undefined {
  return trackedProjects.find((project) => project.slug === slug);
}

/**
 * Every artifact version of a tracked project, with the latest stable
 * version of each artifact marked.
 */
export async function getProjectArtifacts(
  project: TrackedProjectDefinition,
): Promise<ArtifactVersionEntry[]> {
  const projectVersions = (await getPortfolio()).filter((item) =>
    belongsTo(item, project),
  );

  return groupByArtifact(projectVersions).flatMap((artifactVersions) => {
    const entries = artifactVersions.map((version) => ({
      uuid: version.uuid,
      name: version.name,
      group: version.group ?? undefined,
      version: version.version ?? "",
      vulnerabilities: toVulnerabilityCounts(version.metrics),
    }));
    const latest = latestVersion(entries);
    return entries.map((entry) => ({ ...entry, isLatest: entry === latest }));
  });
}
