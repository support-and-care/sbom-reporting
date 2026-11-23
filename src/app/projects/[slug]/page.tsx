import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { pageContainerStyles } from "@/components/layout/pageContainer";
import { ArtifactFilterPanel } from "@/components/project/ArtifactFilterPanel";
import { MostAffectedChart } from "@/components/project/MostAffectedChart";
import { ProjectBreadcrumb } from "@/components/project/ProjectBreadcrumb";
import {
  ProjectExplorer,
  resultsGridStyles,
} from "@/components/project/ProjectExplorer";
import { VulnerabilityStats } from "@/components/project/VulnerabilityStats";
import {
  trackedProjects,
  type TrackedProjectDefinition,
} from "@/config/tracked-projects";
import {
  findTrackedProject,
  getProjectArtifacts,
} from "@/lib/data/project-artifacts";
import { loadFromDt } from "@/lib/dt/client";
import { cn } from "@/lib/utils";
import {
  ARTIFACTS_PAGE_SIZE,
  mostAffectedArtifacts,
  parseArtifactQuery,
} from "@/lib/project-artifacts";

type ProjectPageProps = PageProps<"/projects/[slug]">;

export function generateStaticParams() {
  return trackedProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const project = findTrackedProject((await params).slug);
  return project
    ? { title: project.name, description: project.description }
    : {};
}

const containerStyles = cn(pageContainerStyles, "mt-15 mb-26");

function ProjectDataSkeleton() {
  return (
    <>
      <VulnerabilityStats summary="loading" />
      <div className="mt-15">
        <MostAffectedChart artifacts="loading" />
      </div>
      <div className="mt-15 grid gap-6 lg:grid-cols-[21.8125rem_1fr]">
        <ArtifactFilterPanel query={parseArtifactQuery({})} />
        <div aria-busy className={resultsGridStyles}>
          <span className="sr-only">Loading artifacts</span>
          {Array.from({ length: ARTIFACTS_PAGE_SIZE }, (_, index) => (
            <div
              key={index}
              className="h-49 animate-pulse rounded-[1.25rem] bg-blue-50"
            />
          ))}
        </div>
      </div>
    </>
  );
}

async function ProjectData({ project }: { project: TrackedProjectDefinition }) {
  const entries = await loadFromDt(() => getProjectArtifacts(project));
  if (!entries) {
    return (
      <p className="text-xl text-neutral-700">
        Project data is unavailable right now. Please try again later.
      </p>
    );
  }

  return (
    <ProjectExplorer
      slug={project.slug}
      projectName={project.name}
      artifactLabel={project.artifactLabel}
      entries={entries}
      chart={<MostAffectedChart artifacts={mostAffectedArtifacts(entries)} />}
    />
  );
}

async function ProjectView({ params }: Pick<ProjectPageProps, "params">) {
  const project = findTrackedProject((await params).slug);
  if (!project) notFound();

  return (
    <div className={containerStyles}>
      <ProjectBreadcrumb projectName={project.name} />

      <header className="mt-8 flex flex-wrap items-center gap-x-7.25 gap-y-2 font-display font-semibold">
        <h1 className="text-3xl leading-10 tracking-[-0.01em] text-slate-900">
          {project.name}
        </h1>
        <p className="text-base leading-6 text-slate-600">
          {project.description}
        </p>
      </header>

      <p className="mt-8 mb-6 text-caption text-neutral-700">
        Vulnerability overview and artifact directory
      </p>
      <Suspense fallback={<ProjectDataSkeleton />}>
        <ProjectData project={project} />
      </Suspense>
    </div>
  );
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <Suspense
      fallback={
        <div className={containerStyles}>
          <ProjectDataSkeleton />
        </div>
      }
    >
      <ProjectView params={params} />
    </Suspense>
  );
}
