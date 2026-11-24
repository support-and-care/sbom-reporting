import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/site";

type ProjectBreadcrumbProps = {
  projectName: string;
};

export function ProjectBreadcrumb({ projectName }: ProjectBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-3 text-sm leading-4 font-bold">
        <li className="flex items-center gap-2">
          <Link
            href={routes.home}
            className="text-neutral-400 hover:text-blue-700"
          >
            Home
          </Link>
          <ChevronLeft
            aria-hidden
            className="size-3 text-neutral-400"
            strokeWidth={2.5}
          />
        </li>
        <li>
          <span aria-current="page" className="text-blue-700">
            {projectName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
