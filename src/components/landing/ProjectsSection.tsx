import { Suspense } from "react";
import { ProjectCard } from "@/components/landing/ProjectCard";
import { trackedProjects } from "@/config/tracked-projects";
import { getProjectOverview } from "@/lib/data/projects";
import { loadFromDt } from "@/lib/dt/client";
import { formatNumber } from "@/lib/format";

async function ProjectOverviewList() {
  const overview = await loadFromDt(getProjectOverview);

  if (!overview) {
    return (
      <p className="text-xl text-neutral-700">
        The project overview is unavailable right now. Please try again later.
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-8 md:grid-cols-2 md:gap-22">
        {overview.projects.map((project) => (
          <li key={project.slug} className="flex">
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
      {overview.unassignedArtifactCount > 0 && (
        <p className="text-base text-neutral-600">
          {formatNumber(overview.unassignedArtifactCount)} more{" "}
          {overview.unassignedArtifactCount === 1
            ? "artifact is"
            : "artifacts are"}{" "}
          not assigned to a project yet.
        </p>
      )}
    </>
  );
}

function ProjectOverviewSkeleton() {
  return (
    <div aria-busy className="grid gap-8 md:grid-cols-2 md:gap-22">
      <span className="sr-only">Loading tracked projects</span>
      {trackedProjects.map((project) => (
        <div
          key={project.slug}
          className="h-54.5 animate-pulse rounded-card bg-neutral-50"
        />
      ))}
    </div>
  );
}

export function ProjectsSection() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="flex flex-col gap-8"
    >
      <h2
        id="projects-title"
        className="font-display text-3xl font-semibold sm:text-4xl"
      >
        Overview of Tracked Projects
      </h2>
      <Suspense fallback={<ProjectOverviewSkeleton />}>
        <ProjectOverviewList />
      </Suspense>
    </section>
  );
}
