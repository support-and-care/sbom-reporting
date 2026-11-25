import { FINDING_SEVERITY_LABELS, type FindingSeverity } from "@/lib/artifact";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const badgeStyles: Record<FindingSeverity, string> = {
  critical: "bg-severity-critical text-neutral-0",
  high: "bg-severity-high-subtle text-severity-high-strong",
  medium: "bg-severity-medium-subtle text-severity-medium-strong",
  low: "border border-severity-low bg-severity-low-subtle text-severity-medium-strong",
  unassigned: "border border-neutral-200 bg-neutral-50 text-neutral-700",
};

type SeverityBadgeProps = {
  severity: FindingSeverity;
  /** Shown before the label, e.g. `24 High`. */
  count?: number;
};

export function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-1 text-caption font-bold whitespace-nowrap",
        badgeStyles[severity],
      )}
    >
      {count !== undefined && `${formatNumber(count)} `}
      {FINDING_SEVERITY_LABELS[severity]}
    </span>
  );
}
