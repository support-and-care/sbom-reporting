import type {
  ArtifactSearchResult,
  VulnerabilityCounts,
} from "@/lib/data/artifacts";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const severities: (keyof VulnerabilityCounts)[] = [
  "critical",
  "high",
  "medium",
  "low",
];

function VulnerabilitySummary({ counts }: { counts: VulnerabilityCounts }) {
  const parts = severities
    .filter((severity) => counts[severity] > 0)
    .map((severity) => `${formatNumber(counts[severity])} ${severity}`);
  const isSevere = counts.critical > 0 || counts.high > 0;

  return (
    <p
      className={cn(
        "text-xl md:text-right",
        isSevere ? "font-bold text-destructive" : "text-neutral-700",
      )}
    >
      {parts.length > 0 ? parts.join(" · ") : "No known vulnerabilities"}
    </p>
  );
}

type ArtifactResultProps = {
  artifact: ArtifactSearchResult;
};

export function ArtifactResult({ artifact }: ArtifactResultProps) {
  const versions = `${formatNumber(artifact.versionCount)} ${
    artifact.versionCount === 1 ? "version" : "versions"
  }`;

  return (
    <article className="grid gap-3 rounded-card border border-neutral-200 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold break-all">
          {artifact.group && (
            <span className="text-neutral-600">{artifact.group} : </span>
          )}
          {artifact.name}
        </h2>
        <p className="text-base text-neutral-700">
          Latest {artifact.latest.version} · {versions}
        </p>
      </div>
      <VulnerabilitySummary counts={artifact.latest.vulnerabilities} />
    </article>
  );
}
