import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/site";

type ArtifactBreadcrumbProps = {
  artifactName: string;
  project?: { slug: string; name: string };
};

export function ArtifactBreadcrumb({
  artifactName,
  project,
}: ArtifactBreadcrumbProps) {
  const ancestors = [
    { label: "Home", href: routes.home },
    ...(project
      ? [{ label: project.name, href: routes.project(project.slug) }]
      : []),
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-4 font-bold">
        {ancestors.map((item) => (
          <li key={item.href} className="flex items-center gap-2">
            <Link
              href={item.href}
              className="text-neutral-400 hover:text-blue-700"
            >
              {item.label}
            </Link>
            <ChevronRight
              aria-hidden
              className="size-3 text-neutral-400"
              strokeWidth={2.5}
            />
          </li>
        ))}
        <li className="min-w-0 wrap-break-word">
          <span aria-current="page" className="text-blue-700">
            {artifactName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
