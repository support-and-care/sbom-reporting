import Link from "next/link";
import { routes } from "@/config/site";
import type { TrackedProjectOverview } from "@/lib/data/projects";
import { formatNumber } from "@/lib/format";

type ProjectCardProps = {
  project: TrackedProjectOverview;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={routes.project(project.slug)}
      className="group flex w-full flex-col"
    >
      <span aria-hidden className="h-4.5 rounded-card bg-blue-700" />
      <span className="flex min-h-50 flex-1 flex-col justify-center gap-4 rounded-card border border-neutral-200 px-5 py-3.5 transition-colors group-hover:border-blue-700">
        <span className="text-3xl font-semibold">{project.name}</span>
        <span className="text-xl">{project.description}</span>
        <span className="text-xl">{project.highlights}</span>
        <span className="text-xl font-bold text-blue-700">
          {formatNumber(project.artifactCount)}{" "}
          {project.artifactCount === 1 ? "artifact" : "artifacts"} →
        </span>
      </span>
    </Link>
  );
}
