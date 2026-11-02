import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { PackageReportCard } from "@/components/landing/PackageReportCard";
import { ArtifactSearchForm } from "@/components/search/ArtifactSearchForm";
import { sbomExplainerUrl } from "@/content/landing";
import {
  getFeaturedPackageReport,
  getLatestSnapshotDate,
} from "@/lib/data/report";
import { loadFromDt } from "@/lib/dt/client";
import { formatDate } from "@/lib/format";

const snapshotNoteStyles = "mt-7.5 text-base text-neutral-0";
const reportCardStyles = "hidden xl:block";

async function SnapshotNote() {
  const snapshotDate = await loadFromDt(getLatestSnapshotDate);
  if (!snapshotDate) return null;

  return (
    <p className={snapshotNoteStyles}>
      all data from snapshot:{" "}
      <time dateTime={snapshotDate}>{formatDate(snapshotDate)}</time>
    </p>
  );
}

async function FeaturedPackageReport() {
  const report = await loadFromDt(getFeaturedPackageReport);
  return (
    <PackageReportCard
      report={report ?? "unavailable"}
      className={reportCardStyles}
    />
  );
}

export function HeroSection() {
  return (
    <section className="bg-blue-900 text-neutral-0">
      <div className="mx-auto flex min-h-147 w-full max-w-360 items-center justify-between gap-10 px-6 py-12 sm:px-15.5 xl:pr-16">
        <div className="flex w-full max-w-157 flex-col">
          <h1 className="flex flex-col gap-1 font-display text-4xl font-bold sm:gap-2 sm:text-5xl">
            <span>Know what your</span>
            <span>
              software <span className="text-blue-500">depends on.</span>
            </span>
          </h1>

          <p className="mt-11.5 max-w-134 text-xl">
            <span className="block text-[#d9daf4]">
              Explore software bills of materials, dependencies,
            </span>
            <span className="block tracking-display text-neutral-100">
              and vulnerability reports the open-source projects Open Elements
              tracks.
            </span>
          </p>

          <a
            href={sbomExplainerUrl}
            className="mt-7.5 flex w-fit items-center gap-3 py-2.5 text-xl tracking-display text-blue-300 hover:underline"
          >
            New to SBOMs? 2-minute explainer
            <ArrowUpRight className="size-6 shrink-0" />
          </a>

          <ArtifactSearchForm size="hero" className="mt-8.5 sm:gap-3.5" />

          <Suspense
            fallback={
              <p aria-hidden className={`${snapshotNoteStyles} invisible`}>
                all data from snapshot: …
              </p>
            }
          >
            <SnapshotNote />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <PackageReportCard report="loading" className={reportCardStyles} />
          }
        >
          <FeaturedPackageReport />
        </Suspense>
      </div>
    </section>
  );
}
