import {
  FINDING_SEVERITIES,
  totalOf,
  type FindingSeverity,
  type SeverityCounts,
} from "@/lib/artifact";
import { cn } from "@/lib/utils";

const severityFills: Record<FindingSeverity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  unassigned: "bg-neutral-300",
};

type SeverityBarProps = {
  counts: SeverityCounts;
  /** Share of the track the bar fills, from 0 to 1. */
  fill?: number;
  className?: string;
};

/**
 * Vulnerabilities split by severity as one bar of rounded segments. The bar
 * is decorative; callers put the numbers in text next to it.
 */
export function SeverityBar({ counts, fill = 1, className }: SeverityBarProps) {
  const total = totalOf(counts);
  if (total === 0) return null;

  return (
    <span
      aria-hidden
      className={cn("flex gap-0.5", className)}
      style={{ width: `${fill * 100}%` }}
    >
      {FINDING_SEVERITIES.filter((severity) => counts[severity] > 0).map(
        (severity) => (
          <span
            key={severity}
            className={cn("h-full rounded-full", severityFills[severity])}
            style={{ flexGrow: counts[severity], flexBasis: 0 }}
          />
        ),
      )}
    </span>
  );
}
