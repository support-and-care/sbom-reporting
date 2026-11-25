import "server-only";

import { routes } from "@/config/site";
import {
  trackedProjects,
  type TrackedProjectDefinition,
} from "@/config/tracked-projects";
import {
  compareFindings,
  fixStatus,
  type AffectedRange,
  type Dependency,
  type Finding,
  type FindingSeverity,
  type FixStatuses,
  SBOM_SIZE_FORMAT,
  type SbomFormat,
} from "@/lib/artifact";
import { memoize } from "@/lib/data/memo";
import { epochToIso } from "@/lib/format";
import { getPortfolio, type PortfolioProject } from "@/lib/data/portfolio";
import { belongsTo } from "@/lib/data/projects";
import { dtGet, dtGetAll, dtGetRaw } from "@/lib/dt/client";
import type {
  DtAffectedComponent,
  DtComponent,
  DtExternalReference,
  DtFinding,
  DtProjectDetail,
  DtSeverity,
  DtVulnerability,
} from "@/lib/dt/types";
import { purlNamespace, purlType, purlWithoutVersion } from "@/lib/purl";
import { repositoryLink, webLink } from "@/lib/repository";
import {
  compareVersions,
  isStableVersion,
  latestVersion,
} from "@/lib/versions";

// The artifact page: one artifact (all versions of a Dependency-Track project
// name) and the report of one of its versions.

export type ArtifactVersionOption = {
  uuid: string;
  version: string;
  isLatest: boolean;
  /** Epoch milliseconds; identifies the SBOM the version was imported from. */
  lastBomImport?: number;
};

export type ArtifactOverview = {
  name: string;
  /** Package URL namespace, e.g. the Maven groupId. */
  group?: string;
  /** Tracked project the artifact belongs to, if any. */
  project?: Pick<TrackedProjectDefinition, "slug" | "name" | "homepage">;
  /** Newest first. */
  versions: ArtifactVersionOption[];
};

/**
 * Numbered versions newest first, then named ones such as `SNAPSHOT`, which
 * would otherwise sort above every release.
 */
function newestFirst(a: { version: string }, b: { version: string }): number {
  const isNumbered = (version: string) => /^\d/.test(version);
  return (
    Number(isNumbered(b.version)) - Number(isNumbered(a.version)) ||
    compareVersions(b.version, a.version)
  );
}

/** The artifact named `name`, or `null` if Dependency-Track has no such project. */
export async function getArtifactOverview(
  name: string,
): Promise<ArtifactOverview | null> {
  const projects = (await getPortfolio()).filter(
    (project) => project.name === name,
  );
  if (projects.length === 0) return null;

  const options = projects.map((project) => ({
    uuid: project.uuid,
    version: project.version ?? "",
    lastBomImport: project.lastBomImport ?? undefined,
  }));
  const latest = latestVersion(options);
  const reference =
    projects.find((project) => project.uuid === latest?.uuid) ?? projects[0];
  const owner = trackedProjects.find((project) =>
    belongsTo(reference, project),
  );

  return {
    name,
    group: purlNamespace(reference.purl),
    project: owner && {
      slug: owner.slug,
      name: owner.name,
      homepage: owner.homepage,
    },
    versions: options
      .map((option) => ({ ...option, isLatest: option === latest }))
      .sort(newestFirst),
  };
}

/** The requested version, or the latest one if it is missing or unknown. */
export function selectVersion(
  overview: ArtifactOverview,
  requested: string | undefined,
): ArtifactVersionOption {
  return (
    overview.versions.find((option) => option.version === requested) ??
    overview.versions.find((option) => option.isLatest) ??
    overview.versions[0]
  );
}

export type ExternalLink = {
  title: string;
  description: string;
  url: string;
  logo?: "maven-central" | "apache-maven" | "github" | "advisories";
};

export type ArtifactReport = {
  /**
   * Fix status of each finding, by `Finding.key`. Comes later than the rest
   * because it needs one advisory lookup per vulnerability.
   */
  fixes: Promise<FixStatuses>;
  /** Licences of the artifact's own modules, i.e. components in its group. */
  licenses: string[];
  /** ISO timestamp of the last vulnerability analysis. */
  lastScannedAt?: string;
  /** Most severe first. */
  findings: Finding[];
  dependencies: Dependency[];
  links: ExternalLink[];
};

/** Up to this many components are read, 100 per request. */
const MAX_COMPONENT_PAGES = 50;
/** Advisories looked up at the same time. */
const ADVISORY_CONCURRENCY = 16;

const DT_SEVERITIES: Record<DtSeverity, FindingSeverity> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "unassigned",
  UNASSIGNED: "unassigned",
};

function referenceUrl(
  references: DtExternalReference[] | null | undefined,
  type: string,
): string | undefined {
  return webLink(references?.find((reference) => reference.type === type)?.url);
}

function repositoryUrl(
  references: DtExternalReference[] | null | undefined,
): string | undefined {
  return repositoryLink(
    references?.find((reference) => reference.type === "vcs")?.url,
  );
}

function licenseOf(component: DtComponent): string | undefined {
  return (
    component.resolvedLicense?.licenseId ??
    component.resolvedLicense?.name ??
    component.licenseExpression ??
    component.license ??
    undefined
  );
}

/** Runs `run` over `items` with at most `limit` calls in flight. */
async function mapWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

// Advisories rarely change; their affected ranges are kept for hours.
const cachedAdvisory = memoize<DtAffectedComponent[]>({
  ttlMs: 6 * 60 * 60 * 1000,
  maxEntries: 5000,
});

function affectedComponents(
  source: string,
  vulnId: string,
): Promise<DtAffectedComponent[]> {
  return cachedAdvisory(`${source}/${vulnId}`, async () => {
    const { data } = await dtGet<DtVulnerability>(
      `/v1/vulnerability/source/${encodeURIComponent(source)}/vuln/${encodeURIComponent(vulnId)}`,
    );
    return data?.affectedComponents ?? [];
  }).catch(() => []);
}

function toRange(affected: DtAffectedComponent): AffectedRange {
  if (affected.versionType === "EXACT")
    return { version: affected.version ?? "" };
  return {
    startIncluding: affected.versionStartIncluding ?? undefined,
    startExcluding: affected.versionStartExcluding ?? undefined,
    endIncluding: affected.versionEndIncluding ?? undefined,
    endExcluding: affected.versionEndExcluding ?? undefined,
  };
}

/** Fix status of each finding, from the affected ranges of its advisory. */
async function toFixStatuses(findings: DtFinding[]): Promise<FixStatuses> {
  const advisories = new Map(
    findings.map(({ vulnerability }) => [
      `${vulnerability.source}/${vulnerability.vulnId}`,
      vulnerability,
    ]),
  );
  const affected = new Map(
    await mapWithLimit(
      [...advisories],
      ADVISORY_CONCURRENCY,
      async ([key, { source, vulnId }]) =>
        [key, await affectedComponents(source, vulnId)] as const,
    ),
  );

  return Object.fromEntries(
    findings.map(({ component, vulnerability, matrix }) => {
      const version = component.version ?? "";
      const packageUrl = purlWithoutVersion(component.purl)?.toLowerCase();
      const ranges = (
        affected.get(`${vulnerability.source}/${vulnerability.vulnId}`) ?? []
      )
        .filter(
          (entry) =>
            entry.identityType === "PURL" &&
            entry.identity?.toLowerCase() === packageUrl,
        )
        .map(toRange);
      return [
        matrix,
        fixStatus(version, component.latestVersion ?? undefined, ranges),
      ];
    }),
  );
}

function toFindings(
  findings: DtFinding[],
  sourceCodeUrls: Map<string, string | undefined>,
): Finding[] {
  return findings
    .map(({ component, vulnerability, matrix }): Finding => {
      const cve = vulnerability.vulnId.startsWith("CVE-")
        ? undefined
        : vulnerability.aliases?.find((alias) => alias.cveId)?.cveId;

      return {
        key: matrix,
        vulnId: vulnerability.vulnId,
        source: vulnerability.source,
        cve,
        severity: DT_SEVERITIES[vulnerability.severity ?? "UNASSIGNED"],
        component: {
          name: component.name,
          group: component.group ?? undefined,
          version: component.version ?? "",
        },
        sourceCodeUrl: sourceCodeUrls.get(component.uuid),
      };
    })
    .sort(compareFindings);
}

/** Versions of tracked artifacts, by Package URL namespace and name. */
function trackedVersions(
  portfolio: PortfolioProject[],
): Map<string, Set<string>> {
  const tracked = new Map<string, Set<string>>();
  for (const project of portfolio) {
    const key = `${purlNamespace(project.purl) ?? ""}/${project.name}`;
    const versions = tracked.get(key) ?? new Set<string>();
    if (project.version) versions.add(project.version);
    tracked.set(key, versions);
  }
  return tracked;
}

function toDependency(
  component: DtComponent,
  tracked: Map<string, Set<string>>,
): Dependency {
  const metrics = component.metrics;
  const version = component.version ?? "";
  const trackedVersionsOfComponent = tracked.get(
    `${purlNamespace(component.purl) ?? ""}/${component.name}`,
  );
  return {
    key: component.uuid,
    name: component.name,
    group: component.group ?? undefined,
    version,
    latestVersion: component.repositoryMeta?.latestVersion ?? undefined,
    license: licenseOf(component),
    sourceCodeUrl: repositoryUrl(component.externalReferences),
    vulnerabilities: {
      critical: metrics?.critical ?? 0,
      high: metrics?.high ?? 0,
      medium: metrics?.medium ?? 0,
      low: metrics?.low ?? 0,
      unassigned: metrics?.unassigned ?? 0,
    },
    href:
      trackedVersionsOfComponent &&
      routes.artifact(
        component.name,
        trackedVersionsOfComponent.has(version) ? version : undefined,
      ),
  };
}

const OSV_ECOSYSTEMS: Record<string, string> = {
  cargo: "crates.io",
  composer: "Packagist",
  gem: "RubyGems",
  golang: "Go",
  maven: "Maven",
  npm: "npm",
  nuget: "NuGet",
  pypi: "PyPI",
};

/** Page of the artifact in its package registry. */
function registryLink(
  type: string | undefined,
  group: string | undefined,
  name: string,
  version: string,
): ExternalLink | undefined {
  // Pre-releases such as snapshots are usually not published.
  const release = isStableVersion(version) ? version : undefined;
  const path = (...parts: (string | undefined)[]) =>
    parts
      .filter(Boolean)
      .map((part) => encodeURIComponent(part as string))
      .join("/");

  switch (type) {
    case "maven":
      return group
        ? {
            title: "Maven Central",
            description: "Artifact metadata",
            url: `https://central.sonatype.com/artifact/${path(group, name, release)}`,
            logo: "maven-central",
          }
        : undefined;
    case "pypi":
      return {
        title: "PyPI",
        description: "Package metadata",
        url: `https://pypi.org/project/${path(name, release)}/`,
      };
    case "npm":
      return {
        title: "npm",
        description: "Package metadata",
        url: `https://www.npmjs.com/package/${group ? `${group}/` : ""}${encodeURIComponent(name)}${release ? `/v/${release}` : ""}`,
      };
    case "golang":
      return {
        title: "Go Packages",
        description: "Module documentation",
        url: `https://pkg.go.dev/${group ? `${group}/` : ""}${name}${release ? `@v${release}` : ""}`,
      };
    default:
      return undefined;
  }
}

function externalLinks(
  overview: ArtifactOverview,
  project: DtProjectDetail,
  version: string,
): ExternalLink[] {
  const type = purlType(project.purl);
  const homepage = referenceUrl(project.externalReferences, "website");
  const repository = repositoryUrl(project.externalReferences);
  const ecosystem = type && OSV_ECOSYSTEMS[type];
  const osvName =
    overview.group && type === "maven"
      ? `${overview.group}:${overview.name}`
      : overview.name;

  const links: (ExternalLink | undefined)[] = [
    registryLink(type, overview.group, overview.name, version),
    homepage
      ? {
          title: overview.project?.homepage.label ?? new URL(homepage).hostname,
          description: "Project homepage",
          url: homepage,
          logo: overview.project?.homepage.logo,
        }
      : undefined,
    repository
      ? {
          title: "Source repository",
          description: "Code and release history",
          url: repository,
          logo:
            new URL(repository).hostname === "github.com"
              ? "github"
              : undefined,
        }
      : undefined,
    ecosystem
      ? {
          title: "Security advisories",
          description: "Related advisories",
          url: `https://osv.dev/list?ecosystem=${encodeURIComponent(ecosystem)}&q=${encodeURIComponent(osvName)}`,
          logo: "advisories",
        }
      : undefined,
  ];
  return links.filter((link): link is ExternalLink => Boolean(link));
}

async function loadReport(
  overview: ArtifactOverview,
  selected: ArtifactVersionOption,
): Promise<ArtifactReport> {
  const [{ data: project }, { data: findings }, { items: components }] =
    await Promise.all([
      dtGet<DtProjectDetail>(`/v1/project/${selected.uuid}`),
      dtGet<DtFinding[]>(`/v1/finding/project/${selected.uuid}`),
      dtGetAll<DtComponent>(
        `/v1/component/project/${selected.uuid}`,
        {},
        { maxPages: MAX_COMPONENT_PAGES },
      ),
    ]);
  const tracked = trackedVersions(await getPortfolio());

  const sourceCodeUrls = new Map(
    components.map((component) => [
      component.uuid,
      repositoryUrl(component.externalReferences),
    ]),
  );
  const licenses = new Set(
    components
      .filter(
        (component) =>
          overview.group && purlNamespace(component.purl) === overview.group,
      )
      .flatMap((component) => licenseOf(component) ?? []),
  );

  return {
    // Not awaited: the page shows the findings while these are looked up.
    fixes: toFixStatuses(findings ?? []).catch((error) => {
      console.error("[artifact] Fix status lookup failed:", error);
      return {};
    }),
    licenses: [...licenses].sort(),
    lastScannedAt: epochToIso(project.lastVulnerabilityAnalysis),
    findings: toFindings(findings ?? [], sourceCodeUrls),
    dependencies: components.map((component) =>
      toDependency(component, tracked),
    ),
    links: externalLinks(overview, project, selected.version),
  };
}

// Reports are read by several parts of the page and change with the next
// analysis, so they are kept as briefly as the portfolio.
const cachedReport = memoize<ArtifactReport>({
  ttlMs: 5 * 60 * 1000,
  maxEntries: 100,
});

export function getArtifactReport(
  overview: ArtifactOverview,
  selected: ArtifactVersionOption,
): Promise<ArtifactReport> {
  return cachedReport(selected.uuid, () => loadReport(overview, selected));
}

const SBOM_MEDIA_TYPES: Record<SbomFormat, string> = {
  json: "application/vnd.cyclonedx+json",
  xml: "application/vnd.cyclonedx+xml",
};

/** The CycloneDX SBOM of a version, as exported by Dependency-Track. */
export function exportSbom(
  uuid: string,
  format: SbomFormat,
): Promise<Response> {
  return dtGetRaw(
    `/v1/bom/cyclonedx/project/${encodeURIComponent(uuid)}`,
    { format, variant: "inventory" },
    SBOM_MEDIA_TYPES[format],
  );
}

// An SBOM only changes when a new one is imported, which changes the key.
const cachedSbomSize = memoize<number>({
  ttlMs: 24 * 60 * 60 * 1000,
  maxEntries: 500,
});

/** Size in bytes of the version's SBOM in `SBOM_SIZE_FORMAT`. */
export function getSbomSize(selected: ArtifactVersionOption): Promise<number> {
  return cachedSbomSize(
    `${selected.uuid}:${selected.lastBomImport}`,
    async () =>
      (await (await exportSbom(selected.uuid, SBOM_SIZE_FORMAT)).arrayBuffer())
        .byteLength,
  );
}

/** The portfolio entry with this UUID, so only tracked versions can be exported. */
export async function findArtifactVersion(
  uuid: string,
): Promise<PortfolioProject | undefined> {
  return (await getPortfolio()).find((project) => project.uuid === uuid);
}
