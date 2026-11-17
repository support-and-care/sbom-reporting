import { formatNumber } from "@/lib/format";
import type { ArtifactVersionEntry } from "@/lib/project-artifacts";
import {
  SEVERITIES,
  SEVERITY_LABELS,
  totalVulnerabilities,
  type Severity,
} from "@/lib/severity";
import { cn } from "@/lib/utils";

const segmentStyles: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

/** The longest bar leaves headroom in its track, as in the design. */
const MAX_BAR_SHARE = 0.7;

function describe(entry: ArtifactVersionEntry): string {
  const parts = SEVERITIES.filter((s) => entry.vulnerabilities[s] > 0).map(
    (s) => `${entry.vulnerabilities[s]} ${s}`,
  );
  return `${formatNumber(totalVulnerabilities(entry.vulnerabilities))} vulnerabilities in ${entry.version}: ${parts.join(", ")}`;
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-9 gap-y-2">
      {SEVERITIES.map((severity) => (
        <li key={severity} className="flex items-center gap-2.25">
          <span
            aria-hidden
            className={cn("size-3 rounded-full", segmentStyles[severity])}
          />
          <span className="text-caption text-slate-500">
            {SEVERITY_LABELS[severity]}
          </span>
        </li>
      ))}
    </ul>
  );
}

type MostAffectedChartProps = {
  artifacts: ArtifactVersionEntry[] | "loading";
};

export function MostAffectedChart({ artifacts }: MostAffectedChartProps) {
  const rows = artifacts === "loading" ? [] : artifacts;
  const max = Math.max(
    ...rows.map((entry) => totalVulnerabilities(entry.vulnerabilities)),
    1,
  );

  return (
    <section
      aria-labelledby="most-affected-title"
      aria-busy={artifacts === "loading" || undefined}
      className="flex flex-col gap-3.25 rounded-[1.25rem] border border-neutral-500 bg-neutral-0 p-6 sm:p-10"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start lg:pr-32">
        <div className="flex flex-col gap-2.75">
          <h2
            id="most-affected-title"
            className="font-display text-[1.3125rem] leading-6 font-semibold text-slate-900"
          >
            Most affected artifacts
          </h2>
          <p className="text-caption text-neutral-700">
            {rows.length > 0 ? `Top ${rows.length}` : "Artifacts"} by total
            vulnerability count · Bars are split by severity
          </p>
        </div>
        <Legend />
      </div>

      {artifacts === "loading" ? (
        <div className="mt-8 flex flex-col gap-6.25">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-4.5 animate-pulse rounded-xs bg-neutral-50"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-base text-neutral-700">
          No known vulnerabilities in the latest versions of this project’s
          artifacts.
        </p>
      ) : (
        <div className="flex flex-col gap-4.25">
          <p aria-hidden className="text-right text-xs text-slate-500">
            Total
          </p>
          <ol className="flex flex-col gap-6.25">
            {rows.map((entry) => {
              const total = totalVulnerabilities(entry.vulnerabilities);
              return (
                <li
                  key={entry.uuid}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 pl-1.5 md:grid-cols-[minmax(0,16.875rem)_minmax(0,43.75rem)_1fr] md:gap-x-0"
                >
                  <span className="truncate text-sm leading-4 font-bold text-neutral-900">
                    {entry.name}
                  </span>
                  <span className="sr-only">{describe(entry)}</span>
                  <span
                    aria-hidden
                    className="col-span-2 row-start-2 flex h-4.5 overflow-hidden rounded-xs bg-neutral-50 md:col-span-1 md:col-start-2 md:row-start-1"
                  >
                    {SEVERITIES.map((severity) => {
                      const count = entry.vulnerabilities[severity];
                      if (count === 0) return null;
                      return (
                        <span
                          key={severity}
                          title={`${count} ${SEVERITY_LABELS[severity]}`}
                          className={cn("h-full", segmentStyles[severity])}
                          style={{
                            width: `${(count / max) * MAX_BAR_SHARE * 100}%`,
                          }}
                        />
                      );
                    })}
                  </span>
                  <span
                    aria-hidden
                    className="text-right text-sm font-bold text-slate-900 md:col-start-3 md:row-start-1"
                  >
                    {formatNumber(total)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
