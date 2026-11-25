import { SeverityBar } from "@/components/artifact/SeverityBar";
import {
  countBySeverity,
  describeSeverityCounts,
  totalOf,
  type Finding,
} from "@/lib/artifact";
import { formatNumber } from "@/lib/format";

export function FindingsSummary({ findings }: { findings: Finding[] }) {
  const counts = countBySeverity(findings);
  const total = totalOf(counts);
  const breakdown = describeSeverityCounts(counts).join(" · ");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5 md:flex-row md:items-center md:gap-10 lg:gap-40">
      <div className="flex shrink-0 flex-col gap-2 md:w-76.5">
        <p className="text-base leading-6 font-bold text-neutral-800">
          {total > 0
            ? `${formatNumber(total)} vulnerability ${total === 1 ? "finding" : "findings"}`
            : "No known vulnerability findings"}
        </p>
        {breakdown && (
          <p className="text-caption text-slate-500">{breakdown}</p>
        )}
      </div>
      {total > 0 && (
        <span className="flex h-3.5 w-full max-w-130.75">
          <SeverityBar counts={counts} />
        </span>
      )}
    </div>
  );
}
