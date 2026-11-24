"use client";

import { Check, ChevronDown, FunnelX } from "lucide-react";
import { useId, type ReactNode } from "react";
import { formatNumber } from "@/lib/format";
import {
  activeFilterCount,
  filterLabel,
  isFilterActive,
  SEVERITY_FILTERS,
  VERSION_FILTERS,
  type ArtifactFilter,
  type ArtifactQuery,
  type FacetCounts,
} from "@/lib/project-artifacts";
import { cn } from "@/lib/utils";

function facetCount(facets: FacetCounts, filter: ArtifactFilter): number {
  switch (filter.kind) {
    case "version":
      return facets.versions[filter.value];
    case "severity":
      return facets.severities[filter.value];
    case "knownIssues":
      return facets.knownIssues;
  }
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <details open className="group px-7.5 py-6 last:pb-7.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <h3
          id={headingId}
          className="font-display text-base leading-6 font-semibold text-neutral-900"
        >
          {title}
        </h3>
        <ChevronDown
          aria-hidden
          className="size-6 -rotate-90 text-neutral-900 transition-transform group-open:rotate-0"
        />
      </summary>
      <ul aria-labelledby={headingId} className="mt-4.5 flex flex-col gap-4">
        {children}
      </ul>
    </details>
  );
}

type FilterOptionProps = {
  filter: ArtifactFilter;
  count?: number;
  checked: boolean;
  onToggle?: (filter: ArtifactFilter) => void;
};

function FilterOption({ filter, count, checked, onToggle }: FilterOptionProps) {
  return (
    <li>
      <label
        className={cn(
          "flex w-fit cursor-pointer items-center gap-2.75 text-caption",
          checked ? "text-blue-700" : "text-slate-500 hover:text-neutral-900",
        )}
      >
        <span className="relative grid size-3.75 shrink-0 place-items-center">
          <input
            type="checkbox"
            checked={checked}
            disabled={!onToggle}
            onChange={() => onToggle?.(filter)}
            className="peer size-full cursor-pointer appearance-none rounded-xs border border-slate-300 bg-neutral-0 checked:border-[1.5px] checked:border-blue-700 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          />
          <Check
            aria-hidden
            strokeWidth={3}
            className="pointer-events-none absolute hidden size-2.5 text-blue-700 peer-checked:block"
          />
        </span>
        {filterLabel(filter)}
        {count !== undefined && ` (${formatNumber(count)})`}
      </label>
    </li>
  );
}

type ArtifactFilterPanelProps = {
  query: ArtifactQuery;
  /** Omitted while the counts load. */
  facets?: FacetCounts;
  onToggle?: (filter: ArtifactFilter) => void;
  onClear?: () => void;
};

export function ArtifactFilterPanel({
  query,
  facets,
  onToggle,
  onClear,
}: ArtifactFilterPanelProps) {
  const hasFilters = activeFilterCount(query) > 0;

  const option = (filter: ArtifactFilter) => (
    <FilterOption
      key={filter.kind === "knownIssues" ? filter.kind : filter.value}
      filter={filter}
      count={facets && facetCount(facets, filter)}
      checked={isFilterActive(query, filter)}
      onToggle={onToggle}
    />
  );

  return (
    <aside
      aria-label="Filters"
      aria-busy={!facets || undefined}
      className="flex flex-col divide-y divide-slate-200 self-start rounded-[1.25rem] border-[1.5px] border-blue-100 bg-neutral-0"
    >
      <div className="flex items-center justify-between gap-4 px-7.5 pt-7.5 pb-8">
        <h2 className="text-sm leading-4 font-bold text-slate-900">Filters</h2>
        <button
          type="button"
          disabled={!hasFilters || !onClear}
          onClick={onClear}
          className="flex items-center gap-6.5 text-sm leading-4 font-bold text-blue-700 enabled:hover:underline disabled:cursor-default disabled:text-slate-500"
        >
          Clear filters
          <FunnelX aria-hidden className="size-6 text-slate-500" />
        </button>
      </div>

      <FilterGroup title="Version">
        {VERSION_FILTERS.map((value) => option({ kind: "version", value }))}
      </FilterGroup>
      <FilterGroup title="Vulnerabilities">
        {SEVERITY_FILTERS.map((value) => option({ kind: "severity", value }))}
      </FilterGroup>
      <FilterGroup title="Known issues">
        {option({ kind: "knownIssues" })}
      </FilterGroup>
    </aside>
  );
}
