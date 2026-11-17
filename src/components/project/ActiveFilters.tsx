import { X } from "lucide-react";
import {
  activeFilters,
  filterLabel,
  type ArtifactFilter,
  type ArtifactQuery,
} from "@/lib/project-artifacts";

type ActiveFiltersProps = {
  query: ArtifactQuery;
  onRemove: (filter: ArtifactFilter) => void;
};

export function ActiveFilters({ query, onRemove }: ActiveFiltersProps) {
  const filters = activeFilters(query);
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
      <p className="shrink-0 text-caption font-bold text-neutral-900">
        Active filters:
      </p>
      <ul className="flex flex-wrap items-center gap-3.5">
        {filters.map((filter) => {
          const label = filterLabel(filter);
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onRemove(filter)}
                aria-label={`Remove filter: ${label}`}
                className="flex h-12 min-w-35.25 cursor-pointer items-center justify-center gap-7 rounded-[1.25rem] bg-blue-100 px-4.5 text-caption font-bold text-neutral-900 outline-none hover:bg-blue-200 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {label}
                <X
                  aria-hidden
                  strokeWidth={2.5}
                  className="size-3 text-blue-700"
                />
              </button>
            </li>
          );
        })}
        <li className="text-caption text-neutral-900">
          {filters.length} {filters.length === 1 ? "filter" : "filters"}{" "}
          selected
        </li>
      </ul>
    </div>
  );
}
