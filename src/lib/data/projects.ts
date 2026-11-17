import "server-only";

import {
  trackedProjects,
  type TrackedProjectDefinition,
} from "@/config/tracked-projects";
import { artifactKey } from "@/lib/data/artifacts";
import {
  getPortfolio,
  groupByArtifact,
  type PortfolioProject,
} from "@/lib/data/portfolio";
import { purlNamespace } from "@/lib/purl";

/** Artifacts shown on a project card. */
const HIGHLIGHT_COUNT = 3;

export type TrackedProjectOverview = Omit<
  TrackedProjectDefinition,
  "match" | "artifactLabel"
> & {
  artifactCount: number;
  /** The project's artifacts with the most tracked versions. */
  highlights: string[];
};

export type ProjectOverview = {
  projects: TrackedProjectOverview[];
  /** Artifacts that match none of the tracked projects. */
  unassignedArtifactCount: number;
};

/** Whether a Dependency-Track project (one artifact version) belongs to the tracked project. */
export function belongsTo(
  project: PortfolioProject,
  { match }: TrackedProjectDefinition,
): boolean {
  const namespace = purlNamespace(project.purl);
  if (namespace) {
    return match.purlNamespaces.some(
      (prefix) => namespace === prefix || namespace.startsWith(`${prefix}.`),
    );
  }
  const name = project.name.toLowerCase();
  return match.namePrefixes.some((prefix) => name.startsWith(prefix));
}

export async function getProjectOverview(): Promise<ProjectOverview> {
  const projects = await getPortfolio();

  const versionsByProject = new Map(
    trackedProjects.map((project) => [project.slug, [] as PortfolioProject[]]),
  );
  const unassigned = new Set<string>();

  for (const project of projects) {
    const owner = trackedProjects.find((tracked) =>
      belongsTo(project, tracked),
    );
    if (owner) versionsByProject.get(owner.slug)?.push(project);
    else unassigned.add(artifactKey(project));
  }

  return {
    projects: trackedProjects.map((project) => {
      const artifacts = groupByArtifact(
        versionsByProject.get(project.slug) ?? [],
      );
      return {
        slug: project.slug,
        name: project.name,
        description: project.description,
        artifactCount: artifacts.length,
        highlights: artifacts
          .slice(0, HIGHLIGHT_COUNT)
          .map((versions) => versions[0].name),
      };
    }),
    unassignedArtifactCount: unassigned.size,
  };
}
