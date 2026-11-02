import Image from "next/image";
import type { PackageReport } from "@/lib/data/report";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Shape = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

// Offsets are in px within the 586×490 frame; stroked shapes start half a stroke outside their box.
const shapes: Shape[] = [
  { name: "frame", left: -0.6, top: -0.6, width: 587.2, height: 491.2 },
  { name: "dot-1", left: 24, top: 25, width: 8, height: 8 },
  { name: "dot-2", left: 40, top: 25, width: 8, height: 8 },
  { name: "dot-3", left: 56, top: 25, width: 8, height: 8 },
  { name: "header-divider", left: 1, top: 53.5, width: 584, height: 1 },
  { name: "snapshot-badge", left: 437, top: 83, width: 117, height: 29 },
  { name: "snapshot-dot", left: 449, top: 93, width: 8, height: 8 },
  {
    name: "dependencies-card",
    left: 33.5,
    top: 186.5,
    width: 251,
    height: 112,
  },
  { name: "dependencies-track", left: 54, top: 277, width: 210, height: 4 },
  {
    name: "vulnerabilities-card",
    left: 298.5,
    top: 186.5,
    width: 256,
    height: 112,
  },
  { name: "vulnerabilities-track", left: 319, top: 277, width: 215, height: 4 },
  { name: "severity-track", left: 34, top: 356, width: 520, height: 13 },
  { name: "legend-critical", left: 35, top: 393, width: 8, height: 8 },
  { name: "legend-high", left: 123, top: 393, width: 8, height: 8 },
  { name: "legend-medium", left: 196, top: 393, width: 8, height: 8 },
  { name: "legend-low", left: 293, top: 393, width: 8, height: 8 },
  { name: "footer-divider", left: 34, top: 426.5, width: 520, height: 1 },
];

const severities = [
  {
    key: "critical",
    label: "Critical",
    color: "bg-[#ff778c]",
    left: "left-12.5",
  },
  { key: "high", label: "High", color: "bg-[#ffad68]", left: "left-34.5" },
  { key: "medium", label: "Medium", color: "bg-[#e7c65e]", left: "left-52.75" },
  { key: "low", label: "Low", color: "bg-[#57c7a3]", left: "left-77" },
] as const;

/** Width in px of a bar filled to `part / total` of `trackWidth`. */
function barWidth(part: number, total: number, trackWidth: number): number {
  return total > 0 ? Math.min(part / total, 1) * trackWidth : 0;
}

function describe(report: PackageReport): string {
  const { severity } = report;
  return [
    `Package report for ${report.name} ${report.version}:`,
    `${formatNumber(report.dependencies)} dependencies, ${formatNumber(report.vulnerableDependencies)} of them with known vulnerabilities;`,
    `${formatNumber(report.vulnerabilities)} known vulnerabilities`,
    `(${severity.critical} critical, ${severity.high} high, ${severity.medium} medium, ${severity.low} low).`,
    report.importedAt && `SBOM imported ${formatDate(report.importedAt)}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

type PackageReportCardProps = {
  report: PackageReport | "loading" | "unavailable";
  className?: string;
};

export function PackageReportCard({
  report,
  className,
}: PackageReportCardProps) {
  const data = typeof report === "string" ? undefined : report;
  const severeCount = data ? data.severity.critical + data.severity.high : 0;

  const subtitle = data
    ? [
        `Version ${data.version}`,
        data.ecosystem && `${data.ecosystem} ecosystem`,
      ]
        .filter(Boolean)
        .join(" · ")
    : report === "loading"
      ? "Loading report…"
      : "Report unavailable right now";

  return (
    <div
      role="img"
      aria-busy={report === "loading" || undefined}
      aria-label={data ? describe(data) : `Package report: ${subtitle}`}
      className={cn(
        "relative h-122.5 w-146.5 shrink-0 whitespace-nowrap",
        className,
      )}
    >
      {shapes.map((shape) => (
        <Image
          key={shape.name}
          src={`/images/hero/${shape.name}.svg`}
          alt=""
          width={shape.width}
          height={shape.height}
          className="absolute max-w-none"
          style={{ left: shape.left, top: shape.top }}
        />
      ))}

      <p className="absolute top-5.5 left-20.5 text-xs font-bold text-[#c8c9f4]">
        PACKAGE REPORT
      </p>

      <p className="absolute top-21.25 left-8.5 text-[0.8125rem] text-[#a8a9e0]">
        FEATURED PACKAGE
      </p>
      <p className="absolute top-26.5 left-8.5 max-w-98 truncate font-display text-[1.5625rem] font-bold">
        {data?.name ?? "—"}
      </p>
      <p className="absolute top-35.25 left-8.5 text-sm text-[#b4b6e4]">
        {subtitle}
      </p>
      <p className="absolute top-22.75 left-116 text-[0.6875rem] font-bold text-[#dedcff] uppercase">
        {data?.importedAt ? (
          <time dateTime={data.importedAt} title="SBOM imported">
            {formatDate(data.importedAt)}
          </time>
        ) : (
          "—"
        )}
      </p>

      <p className="absolute top-50.5 left-13.5 text-[0.8125rem] text-[#bfc0e9]">
        Dependencies
      </p>
      <p className="absolute top-56.25 left-13.5 flex items-baseline gap-3">
        <span className="font-display text-[2.125rem] font-bold">
          {data ? formatNumber(data.dependencies) : "—"}
        </span>
        {data && (
          <span className="text-[0.8125rem] text-[#aaaaf0]">
            {formatNumber(data.vulnerableDependencies)} vulnerable
          </span>
        )}
      </p>
      {data && (
        <span
          className="absolute top-69.25 left-13.5 h-1 rounded-full bg-[#817bff]"
          style={{
            width: barWidth(
              data.vulnerableDependencies,
              data.dependencies,
              210,
            ),
          }}
        />
      )}

      <p className="absolute top-50.5 left-79.75 text-[0.8125rem] text-[#bfc0e9]">
        Known vulnerabilities
      </p>
      <p className="absolute top-56.25 left-79.75 flex items-baseline gap-3">
        <span
          className={cn(
            "font-display text-[2.125rem] font-bold",
            data && data.vulnerabilities > 0 && "text-[#ff8797]",
          )}
        >
          {data ? formatNumber(data.vulnerabilities) : "—"}
        </span>
        {data && (
          <span className="text-[0.8125rem] text-[#aaaaf0]">
            {formatNumber(severeCount)} critical or high
          </span>
        )}
      </p>
      {data && (
        <span
          className="absolute top-69.25 left-79.75 h-1 rounded-full bg-[#ff8797]"
          style={{
            width: barWidth(severeCount, data.vulnerabilities, 215),
          }}
        />
      )}

      <p className="absolute top-81.25 left-8.5 text-[0.8125rem] font-bold text-[#d6d6fa]">
        SEVERITY BREAKDOWN
      </p>
      <span className="absolute top-89 left-8.5 flex h-3.25 w-130 overflow-hidden rounded-md">
        {data &&
          severities.map(({ key, color }) => (
            <span
              key={key}
              className={cn("h-full basis-0", color)}
              style={{ flexGrow: data.severity[key] }}
            />
          ))}
      </span>
      {severities.map(({ key, label, left }) => (
        <p
          key={key}
          className={cn("absolute top-97.5 text-xs text-[#c7c8eb]", left)}
        >
          {label}
          {data && ` · ${data.severity[key]}`}
        </p>
      ))}
    </div>
  );
}
