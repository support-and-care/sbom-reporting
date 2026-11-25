import Image from "next/image";
import Link from "next/link";
import { SeverityBadge } from "@/components/project/SeverityBadge";
import { routes } from "@/config/site";
import type { ArtifactVersionEntry } from "@/lib/project-artifacts";
import { SEVERITIES } from "@/lib/severity";

type ArtifactVersionCardProps = {
  entry: ArtifactVersionEntry;
  artifactLabel: string;
};

export function ArtifactVersionCard({
  entry,
  artifactLabel,
}: ArtifactVersionCardProps) {
  const severities = SEVERITIES.filter(
    (severity) => entry.vulnerabilities[severity] > 0,
  );

  return (
    <article className="relative flex h-full gap-5 rounded-[1.25rem] bg-blue-50 p-6 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50 has-[a:hover]:bg-blue-100">
      <Image
        src="/images/project/artifact.svg"
        alt=""
        width={52}
        height={52}
        className="size-13 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-base leading-6 font-semibold break-all text-neutral-900">
              {/* The link covers the whole card. */}
              <Link
                href={routes.artifact(entry.name, entry.version)}
                className="outline-none after:absolute after:inset-0 after:rounded-[1.25rem]"
              >
                {entry.name}
                <span className="sr-only"> {entry.version}</span>
              </Link>
            </h3>
            <p className="text-caption text-neutral-600">
              {entry.group ?? artifactLabel}
            </p>
          </div>
          <p className="w-fit max-w-full min-w-45 truncate rounded-[1.25rem] border border-blue-100 bg-blue-50 p-2.5 font-mono text-caption text-neutral-800">
            {entry.version}
            {entry.isLatest && " · latest"}
          </p>
        </div>
        {severities.length > 0 ? (
          <ul
            aria-label="Known vulnerabilities"
            className="flex flex-wrap items-center gap-x-7.5 gap-y-2"
          >
            {severities.map((severity) => (
              <li key={severity}>
                <SeverityBadge
                  severity={severity}
                  count={entry.vulnerabilities[severity]}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-1 text-caption text-neutral-600">
            No known vulnerabilities
          </p>
        )}
      </div>
    </article>
  );
}
