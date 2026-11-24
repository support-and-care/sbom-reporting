import { formatNumber } from "@/lib/format";
import { SEVERITY_LABELS, type Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";

const badgeStyles: Record<Severity, string> = {
  critical: "bg-severity-critical text-neutral-0",
  high: "bg-severity-high-subtle text-severity-high-strong",
  medium: "bg-severity-medium-subtle text-severity-medium-strong",
  low: "border border-severity-low bg-severity-low-subtle text-severity-medium-strong",
};

type SeverityBadgeProps = {
  severity: Severity;
  count: number;
};

export function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-1 text-caption font-bold whitespace-nowrap",
        badgeStyles[severity],
      )}
    >
      {formatNumber(count)} {SEVERITY_LABELS[severity]}
    </span>
  );
}
