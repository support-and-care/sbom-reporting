"use client";

import { ArrowUpRight, ChevronDown, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  tableHeadStyles,
  tableRowStyles,
} from "@/components/artifact/FindingsSection";
import { SectionHeading } from "@/components/artifact/SectionHeading";
import { SeverityBar } from "@/components/artifact/SeverityBar";
import {
  FilterMenu,
  NotAvailable,
  TableSearchField,
} from "@/components/artifact/TableControls";
import { Pagination } from "@/components/project/Pagination";
import {
  compareDependencies,
  filterDependencies,
  describeSeverityCounts,
  licenseOptions,
  paginate,
  totalOf,
  type Dependency,
} from "@/lib/artifact";
import { formatNumber } from "@/lib/format";

const PAGE_SIZES = [10, 25, 50] as const;
/** Share of the column the longest bar fills, leaving room for the total. */
const MAX_BAR_SHARE = 0.85;

function DependencyRow({
  dependency,
  maxTotal,
}: {
  dependency: Dependency;
  maxTotal: number;
}) {
  const total = totalOf(dependency.vulnerabilities);
  return (
    <tr className={tableRowStyles}>
      <th
        scope="row"
        title={dependency.group}
        className="px-5 py-4 text-left font-mono text-sm leading-4 font-semibold break-all text-neutral-900"
      >
        {dependency.href ? (
          <Link
            href={dependency.href}
            className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline"
          >
            {dependency.name}
            <ArrowUpRight aria-hidden className="size-3" strokeWidth={2.5} />
          </Link>
        ) : (
          dependency.name
        )}
      </th>
      <td>
        {dependency.sourceCodeUrl ? (
          <a
            href={dependency.sourceCodeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Source code of ${dependency.name} (opens in a new tab)`}
            className="inline-flex text-neutral-900 hover:text-blue-700"
          >
            <GitPullRequest aria-hidden className="size-6" />
          </a>
        ) : (
          <NotAvailable />
        )}
      </td>
      <td className="text-[0.9375rem] break-all text-neutral-800">
        {dependency.version}
      </td>
      <td className="text-[0.9375rem] break-all text-neutral-800">
        {dependency.latestVersion ?? <NotAvailable />}
      </td>
      <td className="text-[0.9375rem] text-neutral-800">
        {dependency.license ?? (
          <span className="text-neutral-500">Not declared</span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-4">
          <span className="flex h-2.5 flex-1">
            <SeverityBar
              counts={dependency.vulnerabilities}
              fill={maxTotal > 0 ? (total / maxTotal) * MAX_BAR_SHARE : 0}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-caption text-neutral-800">
            {formatNumber(total)} total
            <span className="sr-only">
              {" "}
              (
              {describeSeverityCounts(dependency.vulnerabilities).join(", ") ||
                "none"}
              )
            </span>
          </span>
        </div>
      </td>
    </tr>
  );
}

export function DependenciesSection({
  dependencies,
}: {
  dependencies: Dependency[];
}) {
  const [q, setQ] = useState("");
  const [licenses, setLicenses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const pageSizeId = useId();
  const titleId = useId();

  const sorted = useMemo(
    () => [...dependencies].sort(compareDependencies),
    [dependencies],
  );
  const options = useMemo(() => licenseOptions(dependencies), [dependencies]);
  const maxTotal = useMemo(
    () =>
      Math.max(
        0,
        ...dependencies.map((dependency) =>
          totalOf(dependency.vulnerabilities),
        ),
      ),
    [dependencies],
  );
  const matches = useMemo(
    () => filterDependencies(sorted, { q, licenses }),
    [sorted, q, licenses],
  );
  const current = paginate(matches, page, pageSize);
  const isFiltered = q.trim() !== "" || licenses.length > 0;

  function updateFilter(apply: () => void) {
    apply();
    setPage(1);
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-10">
      <SectionHeading
        id={titleId}
        title="Dependencies"
        count={dependencies.length}
        description="Select a tracked dependency to open its artifact details. Vulnerability bars show severity at a glance."
      />

      {dependencies.length === 0 ? (
        <p className="text-base text-neutral-700">
          This SBOM lists no dependencies.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-6">
            <TableSearchField
              label="Search dependencies"
              placeholder="Search dependencies"
              value={q}
              onChange={(value) => updateFilter(() => setQ(value))}
            />
            <FilterMenu
              name="Licence"
              placeholder="Licence"
              options={options}
              selected={licenses}
              onChange={(value) => updateFilter(() => setLicenses(value))}
              className="max-w-full sm:max-w-90"
            />
          </div>

          <p className="mt-3 border-b border-neutral-200 pb-3 text-[1.0625rem] font-bold text-blue-900">
            {isFiltered ? "Matching" : "All"} ({formatNumber(matches.length)})
          </p>

          <div className="relative overflow-x-auto">
            <table className="w-full min-w-275 border-collapse">
              <caption className="sr-only">Dependencies</caption>
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[33%]" />
              </colgroup>
              <thead className={tableHeadStyles}>
                <tr>
                  <th scope="col">Dependency</th>
                  <th scope="col">Source code</th>
                  <th scope="col">Used version</th>
                  <th scope="col">Latest</th>
                  <th scope="col">License</th>
                  <th scope="col">Vulnerabilities by severity</th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((dependency) => (
                  <DependencyRow
                    key={dependency.key}
                    dependency={dependency}
                    maxTotal={maxTotal}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {matches.length === 0 ? (
            <p role="status" className="px-5 py-2 text-base text-neutral-700">
              No dependencies match your search.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 px-5">
              <p role="status" className="text-caption text-slate-500">
                Showing {formatNumber(current.firstIndex)}–
                {formatNumber(current.lastIndex)} of{" "}
                {formatNumber(matches.length)} dependencies
              </p>
              <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
                <div className="flex items-center gap-4.5">
                  <label
                    htmlFor={pageSizeId}
                    className="text-caption text-slate-500"
                  >
                    Results per page
                  </label>
                  <span className="relative flex items-center">
                    <select
                      id={pageSizeId}
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                      className="h-8.5 cursor-pointer appearance-none rounded-md border border-neutral-300 bg-neutral-0 pr-8 pl-4 text-caption text-neutral-800 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden
                      className="pointer-events-none absolute right-2.5 size-3.5 text-neutral-700"
                    />
                  </span>
                </div>
                {current.pageCount > 1 && (
                  <Pagination
                    page={current.page}
                    pageCount={current.pageCount}
                    onSelect={setPage}
                    label="Dependency pages"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
