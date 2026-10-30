import { ArrowUpRight } from "lucide-react";
import { ArtifactSearchForm } from "@/components/search/ArtifactSearchForm";
import { sbomExplainerUrl, snapshotDate } from "@/content/landing";
import { formatDate } from "@/lib/format";

export function HeroSection() {
  return (
    <section className="flex min-h-147 flex-col items-center justify-center gap-6 bg-blue-50 px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="max-w-144 font-display text-4xl font-bold tracking-display text-blue-700 sm:text-5xl">
          Know what&apos;s inside the software you use
        </h1>
        <div className="flex max-w-236 flex-col gap-1.5 text-xl tracking-display text-neutral-700 sm:text-2xl">
          <p>
            Dependency and vulnerability reports the open-source projects Open
            Elements tracks.
          </p>
          <p>Point-in-time snapshots, openly shared with everyone.</p>
        </div>
      </div>

      <div className="flex w-full max-w-160 flex-col items-center gap-8">
        <a
          href={sbomExplainerUrl}
          className="flex items-center gap-1.5 p-2.5 text-xl tracking-display text-blue-700 hover:underline"
        >
          New to SBOMs? 2-minute explainer
          <ArrowUpRight className="size-6 shrink-0" />
        </a>

        <ArtifactSearchForm />

        <p className="text-base text-neutral-700">
          all data from snapshot:{" "}
          <time dateTime={snapshotDate}>{formatDate(snapshotDate)}</time>
        </p>
      </div>
    </section>
  );
}
