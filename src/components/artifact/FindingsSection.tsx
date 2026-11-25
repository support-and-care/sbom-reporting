"use client";

import { ArrowRight, ArrowUpRight, SearchCode } from "lucide-react";
import { Suspense, use, useId, useMemo, useState } from "react";
import { SectionHeading } from "@/components/artifact/SectionHeading";
import {
  FilterMenu,
  NotAvailable,
  TableSearchField,
} from "@/components/artifact/TableControls";
import { SeverityBadge } from "@/components/project/SeverityBadge";
import {
  advisorySourceLabel,
  advisoryUrl,
  countBySeverity,
  filterFindings,
  FINDING_SEVERITIES,
  FINDING_SEVERITY_LABELS,
  fixLabel,
  type Finding,
  type FindingSeverity,
  type FixStatuses,
} from "@/lib/artifact";
import { formatNumber } from "@/lib/format";

/** Findings shown before "View all". */
const PREVIEW_COUNT = 3;

export const tableHeadStyles =
  "bg-neutral-100 text-caption font-bold text-neutral-900 uppercase [&_th]:px-5 [&_th]:py-3.5 [&_th]:text-left [&_th]:font-bold [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg";

export const tableRowStyles =
  "border-b border-neutral-200 align-middle [&_td]:px-5 [&_td]:py-4";

const newTab = { target: "_blank", rel: "noreferrer" } as const;

function FindingId({ finding }: { finding: Finding }) {
  const note = finding.cve
    ? `alias ${finding.cve}`
    : finding.vulnId.startsWith("CVE-")
      ? undefined
      : "no CVE assigned";
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono text-sm leading-4 font-semibold break-all text-neutral-900">
        {finding.vulnId}
      </span>
      <span className="flex flex-wrap items-center gap-1.5 text-caption text-neutral-700">
        <span className="rounded-lg border border-neutral-200 px-2.5 py-0.5">
          {advisorySourceLabel(finding.source)}
        </span>
        {note}
      </span>
    </div>
  );
}

/** Waits for the advisory lookups while the rest of the table is shown. */
function FixStatusCell({
  findingKey,
  fixes,
}: {
  findingKey: string;
  fixes: Promise<FixStatuses>;
}) {
  const fix = use(fixes)[findingKey] ?? { kind: "none" };
  return (
    <span
      title={
        fix.kind === "upgrade"
          ? `The latest release, ${fix.version}, is not affected`
          : undefined
      }
    >
      {fixLabel(fix)}
    </span>
  );
}

function FindingRow({
  finding,
  fixes,
}: {
  finding: Finding;
  fixes: Promise<FixStatuses>;
}) {
  const { component } = finding;
  const advisory = advisoryUrl(finding.source, finding.vulnId);
  return (
    <tr className={tableRowStyles}>
      <td>
        <FindingId finding={finding} />
      </td>
      <td className="text-neutral-700">
        <span className="block text-sm leading-6 font-bold break-all">
          {component.name}
        </span>
        <span className="block font-mono text-caption break-all">
          {[component.group, component.version].filter(Boolean).join(" · ")}
        </span>
      </td>
      <td>
        {finding.sourceCodeUrl ? (
          <a
            href={finding.sourceCodeUrl}
            {...newTab}
            aria-label={`Source code of ${component.name} (opens in a new tab)`}
            className="inline-flex text-neutral-900 hover:text-blue-700"
          >
            <SearchCode aria-hidden className="size-6" />
          </a>
        ) : (
          <NotAvailable />
        )}
      </td>
      <td>
        <SeverityBadge severity={finding.severity} />
      </td>
      <td className="text-sm text-neutral-700">{component.version}</td>
      <td className="text-sm text-neutral-800">
        <Suspense
          fallback={
            <span className="block h-4 w-24 animate-pulse rounded-md bg-neutral-100">
              <span className="sr-only">Checking for a fix…</span>
            </span>
          }
        >
          <FixStatusCell findingKey={finding.key} fixes={fixes} />
        </Suspense>
      </td>
      <td>
        {advisory ? (
          <a
            href={advisory}
            {...newTab}
            aria-label={`Advisory ${finding.vulnId} (opens in a new tab)`}
            className="inline-flex items-center gap-1 text-lg leading-6 font-bold whitespace-nowrap text-blue-700 hover:underline"
          >
            Advisory
            <ArrowUpRight aria-hidden className="size-5" strokeWidth={2.5} />
          </a>
        ) : (
          <NotAvailable />
        )}
      </td>
    </tr>
  );
}

type FindingsSectionProps = {
  findings: Finding[];
  /** Resolves after the findings; the fix column shows a placeholder until then. */
  fixes: Promise<FixStatuses>;
};

export function FindingsSection({ findings, fixes }: FindingsSectionProps) {
  const [q, setQ] = useState("");
  const [severities, setSeverities] = useState<FindingSeverity[]>([]);
  const [showAll, setShowAll] = useState(false);
  const titleId = useId();

  const counts = useMemo(() => countBySeverity(findings), [findings]);
  const matches = useMemo(
    () => filterFindings(findings, { q, severities }),
    [findings, q, severities],
  );
  const isFiltered = q.trim() !== "" || severities.length > 0;
  const visible =
    showAll || isFiltered ? matches : matches.slice(0, PREVIEW_COUNT);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-10">
      <SectionHeading
        id={titleId}
        title="Known vulnerability findings"
        count={findings.length}
        description="Search for a CVE to inspect its advisory details, or filter by severity."
      />

      {findings.length === 0 ? (
        <p className="text-base text-neutral-700">
          No known vulnerabilities in this version.
        </p>
      ) : (
        <div className="flex flex-col gap-8.5">
          <div className="flex flex-wrap items-center gap-6">
            <TableSearchField
              label="Search findings"
              placeholder="Search by CVE, GHSA, or component"
              value={q}
              onChange={setQ}
            />
            <FilterMenu
              name="Severity"
              placeholder="All severities"
              withIcon
              options={FINDING_SEVERITIES.filter(
                (severity) => counts[severity] > 0,
              ).map((severity) => ({
                value: severity,
                label: FINDING_SEVERITY_LABELS[severity],
                count: counts[severity],
              }))}
              selected={severities}
              onChange={setSeverities}
              className="w-full sm:w-90"
            />
          </div>

          <div className="flex flex-col">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-275 border-collapse">
                <caption className="sr-only">
                  Known vulnerability findings
                </caption>
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[17%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className={tableHeadStyles}>
                  <tr>
                    <th scope="col">Finding</th>
                    <th scope="col">Components</th>
                    <th scope="col">Source code</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Affected version</th>
                    <th scope="col">Fix / status</th>
                    <th scope="col">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((finding) => (
                    <FindingRow
                      key={finding.key}
                      finding={finding}
                      fixes={fixes}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {matches.length === 0 && (
              <p role="status" className="px-5 py-6 text-base text-neutral-700">
                No findings match your search.
              </p>
            )}
            {isFiltered && matches.length > 0 && (
              <p role="status" className="sr-only">
                {formatNumber(matches.length)} of{" "}
                {formatNumber(findings.length)} findings shown
              </p>
            )}
            {!isFiltered && findings.length > PREVIEW_COUNT && (
              <button
                type="button"
                aria-expanded={showAll}
                onClick={() => setShowAll(!showAll)}
                className="mt-6 flex w-fit cursor-pointer items-center gap-1.5 px-5 text-base leading-6 font-bold text-neutral-900 hover:text-blue-700"
              >
                {showAll
                  ? "Show fewer findings"
                  : `View all ${formatNumber(findings.length)} findings`}
                <ArrowRight
                  aria-hidden
                  className={showAll ? "size-4 -rotate-90" : "size-4"}
                />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
