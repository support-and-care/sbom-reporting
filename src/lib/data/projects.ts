import "server-only";

import {
  trackedProjects,
  type TrackedProjectDefinition,
} from "@/config/tracked-projects";
import { artifactKey } from "@/lib/data/artifacts";
import { dtGetAll } from "@/lib/dt/client";
import type { DtProject } from "@/lib/dt/types";
import { purlNamespace } from "@/lib/purl";

/** Up to 5,000 Dependency-Track projects (one per artifact version). */
const MAX_PROJECT_PAGES = 50;

export type TrackedProjectOverview = Omit<TrackedProjectDefinition, "match"> & {
  artifactCount: number;
};

export type ProjectOverview = {
  projects: TrackedProjectOverview[];
  /** Artifacts that match none of the tracked projects. */
  unassignedArtifactCount: number;
};

function belongsTo(
  project: DtProject,
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
  const { items: projects, truncated } = await dtGetAll<DtProject>(
    "/v1/project",
    {},
    { maxPages: MAX_PROJECT_PAGES },
  );
  if (truncated) {
    console.warn(
      `[projects] Only the first ${projects.length} Dependency-Track projects were counted.`,
    );
  }

  const artifactsByProject = new Map(
    trackedProjects.map((project) => [project.slug, new Set<string>()]),
  );
  const unassigned = new Set<string>();

  for (const project of projects) {
    const owner = trackedProjects.find((tracked) =>
      belongsTo(project, tracked),
    );
    const artifacts = owner ? artifactsByProject.get(owner.slug) : unassigned;
    artifacts?.add(artifactKey(project));
  }

  return {
    projects: trackedProjects.map((project) => ({
      slug: project.slug,
      name: project.name,
      description: project.description,
      highlights: project.highlights,
      artifactCount: artifactsByProject.get(project.slug)?.size ?? 0,
    })),
    unassignedArtifactCount: unassigned.size,
  };
}
