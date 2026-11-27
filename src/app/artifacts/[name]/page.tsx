import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment, Suspense, type ReactNode } from "react";
import { ArtifactBreadcrumb } from "@/components/artifact/ArtifactBreadcrumb";
import { DependenciesSection } from "@/components/artifact/DependenciesSection";
import { DownloadSbomMenu } from "@/components/artifact/DownloadSbomMenu";
import { ExternalReferences } from "@/components/artifact/ExternalReferences";
import { FindingsSection } from "@/components/artifact/FindingsSection";
import { FindingsSummary } from "@/components/artifact/FindingsSummary";
import { VersionMenu } from "@/components/artifact/VersionMenu";
import { pageContainerStyles } from "@/components/layout/pageContainer";
import { formatFileSize, SBOM_SIZE_FORMAT } from "@/lib/artifact";
import {
  getArtifactOverview,
  getArtifactReport,
  getSbomSize,
  selectVersion,
  type ArtifactOverview,
  type ArtifactVersionOption,
} from "@/lib/data/artifact";
import { loadFromDt } from "@/lib/dt/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type ArtifactPageProps = PageProps<"/artifacts/[name]">;

export async function generateMetadata({
  params,
}: ArtifactPageProps): Promise<Metadata> {
  const { name } = await params;
  return {
    title: name,
    description: `Known vulnerabilities, dependencies and SBOM of ${name}.`,
  };
}

const containerStyles = cn(pageContainerStyles, "mt-15 mb-26");
const SBOM_FORMAT_NOTE = `CycloneDX · ${SBOM_SIZE_FORMAT}`;

function Pulse({ className }: { className: string }) {
  return (
    <span
      className={cn("block animate-pulse rounded-md bg-neutral-100", className)}
    />
  );
}

/** Lets long dotted names such as Maven groupIds wrap after a dot. */
function BreakAfterDots({ text }: { text: string }) {
  return text.split(".").map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <>
          .<wbr />
        </>
      )}
      {part}
    </Fragment>
  ));
}

function Unavailable({ children }: { children: ReactNode }) {
  return <p className="text-xl text-neutral-700">{children}</p>;
}

/** Licence and scan date, which come with the report. */
async function ArtifactFacts({
  overview,
  selected,
}: {
  overview: ArtifactOverview;
  selected: ArtifactVersionOption;
}) {
  const report = await loadFromDt(() => getArtifactReport(overview, selected));
  if (!report) return null;

  return (
    <>
      {report.licenses.length > 0 && (
        <p className="text-sm leading-6 font-bold text-neutral-800">
          License: {report.licenses.join(", ")}
        </p>
      )}
      {report.lastScannedAt && (
        <p className="mt-2.25 w-fit rounded-lg border border-neutral-100 px-2 py-1 text-caption text-neutral-700">
          Last scanned:{" "}
          <time dateTime={report.lastScannedAt}>
            {formatDate(report.lastScannedAt)}
          </time>
        </p>
      )}
    </>
  );
}

async function SbomSize({ selected }: { selected: ArtifactVersionOption }) {
  const size = await loadFromDt(() => getSbomSize(selected));
  return (
    <>
      {SBOM_FORMAT_NOTE}
      {size !== undefined && ` · ${formatFileSize(size)}`}
    </>
  );
}

function ReportSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-10.5">
      <span className="sr-only">Loading the vulnerability report</span>
      <Pulse className="h-17.5 w-full" />
      <Pulse className="h-8 w-96 max-w-full" />
      <Pulse className="h-64 w-full" />
      <Pulse className="h-8 w-64 max-w-full" />
      <Pulse className="h-96 w-full" />
    </div>
  );
}

const dividerStyles = "border-neutral-200";

async function ArtifactReportSections({
  overview,
  selected,
}: {
  overview: ArtifactOverview;
  selected: ArtifactVersionOption;
}) {
  const report = await loadFromDt(() => getArtifactReport(overview, selected));
  if (!report) {
    return (
      <Unavailable>
        The report for this version is unavailable right now. Please try again
        later.
      </Unavailable>
    );
  }

  return (
    <div className="flex flex-col gap-10.5">
      <FindingsSummary findings={report.findings} />
      <FindingsSection findings={report.findings} fixes={report.fixes} />
      <hr className={dividerStyles} />
      <DependenciesSection dependencies={report.dependencies} />
      {report.links.length > 0 && (
        <>
          <hr className={dividerStyles} />
          <ExternalReferences links={report.links} />
        </>
      )}
    </div>
  );
}

async function ArtifactView({
  params,
  searchParams,
}: Pick<ArtifactPageProps, "params" | "searchParams">) {
  const [{ name }, query] = await Promise.all([params, searchParams]);
  const overview = await loadFromDt(() => getArtifactOverview(name));
  if (overview === null) notFound();
  if (!overview) {
    return (
      <div className={containerStyles}>
        <Unavailable>
          Artifact data is unavailable right now. Please try again later.
        </Unavailable>
      </div>
    );
  }

  const requested =
    typeof query.version === "string" ? query.version : undefined;
  const selected = selectVersion(overview, requested);

  return (
    <div className={containerStyles}>
      <ArtifactBreadcrumb
        artifactName={overview.name}
        project={overview.project}
      />

      <header className="mt-10 flex flex-col gap-8">
        <h1 className="font-display text-3xl leading-10 font-semibold tracking-[-0.01em] wrap-break-word text-neutral-800">
          {overview.group && (
            <>
              <BreakAfterDots text={overview.group} /> :{" "}
            </>
          )}
          <BreakAfterDots text={overview.name} />
        </h1>

        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <VersionMenu
              artifactName={overview.name}
              versions={overview.versions}
              selected={selected.version}
            />
            <Suspense fallback={<Pulse className="h-14 w-46" />}>
              <ArtifactFacts overview={overview} selected={selected} />
            </Suspense>
          </div>

          <div className="flex w-full flex-col items-center gap-4 sm:w-77.75 lg:mr-9">
            <DownloadSbomMenu uuid={selected.uuid} />
            <p className="text-base leading-6 text-neutral-500">
              <Suspense fallback={SBOM_FORMAT_NOTE}>
                <SbomSize selected={selected} />
              </Suspense>
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8.5">
        <Suspense key={selected.uuid} fallback={<ReportSkeleton />}>
          <ArtifactReportSections overview={overview} selected={selected} />
        </Suspense>
      </div>
    </div>
  );
}

export default function ArtifactPage({
  params,
  searchParams,
}: ArtifactPageProps) {
  return (
    <Suspense
      fallback={
        <div className={containerStyles}>
          <ReportSkeleton />
        </div>
      }
    >
      <ArtifactView params={params} searchParams={searchParams} />
    </Suspense>
  );
}
