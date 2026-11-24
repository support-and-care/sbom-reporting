"use client";

import { useMemo, type ReactNode } from "react";
import { ActiveFilters } from "@/components/project/ActiveFilters";
import { ArtifactFilterPanel } from "@/components/project/ArtifactFilterPanel";
import { ArtifactSearchField } from "@/components/project/ArtifactSearchField";
import { ArtifactVersionCard } from "@/components/project/ArtifactVersionCard";
import { Pagination } from "@/components/project/Pagination";
import { SortSelect } from "@/components/project/SortSelect";
import { useArtifactQuery } from "@/components/project/useArtifactQuery";
import { VulnerabilityStats } from "@/components/project/VulnerabilityStats";
import { formatNumber } from "@/lib/format";
import {
  clearFilters,
  isFilterActive,
  mostAffectedArtifacts,
  projectHref,
  queryArtifactDirectory,
  summarizeProject,
  toggleFilter,
  type ArtifactFilter,
  type ArtifactVersionEntry,
} from "@/lib/project-artifacts";

const ARTIFACTS_SECTION_ID = "artifacts";

export const resultsGridStyles = "grid gap-x-6.5 gap-y-4 md:grid-cols-2";

function scrollToArtifacts() {
  document
    .getElementById(ARTIFACTS_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type ProjectExplorerProps = {
  slug: string;
  projectName: string;
  artifactLabel: string;
  entries: ArtifactVersionEntry[];
  /** Rendered between the summary cards and the artifact directory. */
  chart: ReactNode;
};

/**
 * Summary cards and the artifact directory. All versions are on the client,
 * so searching, filtering, sorting and paging are instant; the URL keeps the
 * current view shareable.
 */
export function ProjectExplorer({
  slug,
  projectName,
  artifactLabel,
  entries,
  chart,
}: ProjectExplorerProps) {
  const [query, setQuery] = useArtifactQuery(slug);
  const summary = useMemo(() => summarizeProject(entries), [entries]);
  // A real artifact of this project, preferably one worth looking up.
  const exampleArtifact = useMemo(
    () => (mostAffectedArtifacts(entries, 1)[0] ?? entries[0])?.name,
    [entries],
  );
  const directory = useMemo(
    () => queryArtifactDirectory(entries, query),
    [entries, query],
  );

  const toggle = (filter: ArtifactFilter) =>
    setQuery(toggleFilter(query, filter));

  return (
    <>
      <VulnerabilityStats
        summary={summary}
        isActive={(filter) => isFilterActive(query, filter)}
        onToggle={(filter) => {
          toggle(filter);
          scrollToArtifacts();
        }}
      />

      <div className="mt-15">{chart}</div>

      <section
        id={ARTIFACTS_SECTION_ID}
        aria-labelledby="artifacts-title"
        className="mt-15 scroll-mt-6"
      >
        <div className="grid gap-x-18.75 gap-y-4 lg:grid-cols-[1fr_22.625rem] lg:items-end">
          <h2
            id="artifacts-title"
            className="font-display text-[1.3125rem] leading-7 font-semibold text-slate-900"
          >
            Artifacts
          </h2>
          <p className="text-base text-blue-700 lg:text-right">
            {formatNumber(summary.artifactCount)}{" "}
            {summary.artifactCount === 1 ? "artifact" : "artifacts"}
          </p>
          <ArtifactSearchField
            projectName={projectName}
            exampleArtifact={exampleArtifact}
            value={query.q}
            onChange={(q) =>
              setQuery({ ...query, q, page: 1 }, { replace: true })
            }
          />
          <SortSelect
            value={query.sort}
            onChange={(sort) => setQuery({ ...query, sort, page: 1 })}
          />
        </div>

        <div className="mt-10.5 grid gap-6 lg:grid-cols-[21.8125rem_1fr]">
          <ArtifactFilterPanel
            query={query}
            facets={directory.facets}
            onToggle={toggle}
            onClear={() => setQuery(clearFilters(query))}
          />

          <div className="flex min-w-0 flex-col gap-6">
            <ActiveFilters query={query} onRemove={toggle} />

            {directory.total === 0 ? (
              <p role="status" className="text-xl text-neutral-700">
                No artifact versions match
                {query.q ? <> &ldquo;{query.q}&rdquo; and</> : null} these
                filters.
              </p>
            ) : (
              <div className="flex flex-col gap-12.5">
                <ul className={resultsGridStyles}>
                  {directory.items.map((entry) => (
                    <li key={entry.uuid}>
                      <ArtifactVersionCard
                        entry={entry}
                        artifactLabel={artifactLabel}
                      />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p role="status" className="text-caption text-slate-600">
                    Showing {formatNumber(directory.firstIndex)}–
                    {formatNumber(directory.lastIndex)} of{" "}
                    {formatNumber(directory.total)}{" "}
                    {directory.total === 1 ? "version" : "versions"}
                  </p>
                  {directory.pageCount > 1 && (
                    <Pagination
                      page={directory.page}
                      pageCount={directory.pageCount}
                      href={(page) => projectHref(slug, { ...query, page })}
                      onSelect={(page) => {
                        setQuery({ ...query, page });
                        scrollToArtifacts();
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
