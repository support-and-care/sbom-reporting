export type Severity = "critical" | "high" | "medium" | "low";

export type VulnerabilityCounts = Record<Severity, number>;

/** Most to least severe. */
export const SEVERITIES: readonly Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function totalVulnerabilities(counts: VulnerabilityCounts): number {
  return SEVERITIES.reduce((sum, severity) => sum + counts[severity], 0);
}
