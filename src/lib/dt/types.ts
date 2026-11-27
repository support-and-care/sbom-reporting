/** Subset of the Dependency-Track v1 REST API response shapes used by this app. */

export type DtProjectMetrics = {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  components?: number;
  vulnerableComponents?: number;
  vulnerabilities?: number;
};

export type DtConciseProject = {
  uuid: string;
  name: string;
  group?: string | null;
  version?: string | null;
  /** Epoch milliseconds. */
  lastBomImport?: number | null;
  metrics?: DtProjectMetrics | null;
};

export type DtProject = {
  uuid: string;
  name: string;
  group?: string | null;
  version?: string | null;
  purl?: string | null;
  /** Epoch milliseconds. */
  lastBomImport?: number | null;
  metrics?: DtProjectMetrics | null;
};

export type DtExternalReference = {
  type: string;
  url: string;
};

/** A single project as returned by `/v1/project/{uuid}`. */
export type DtProjectDetail = DtProject & {
  externalReferences?: DtExternalReference[] | null;
  /** Epoch milliseconds. */
  lastVulnerabilityAnalysis?: number | null;
};

export type DtSeverity =
  "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" | "UNASSIGNED";

export type DtComponentMetrics = DtProjectMetrics & {
  unassigned?: number;
};

export type DtComponent = {
  uuid: string;
  name: string;
  group?: string | null;
  version?: string | null;
  purl?: string | null;
  /** Licence name as declared, when it could not be resolved to SPDX. */
  license?: string | null;
  licenseExpression?: string | null;
  resolvedLicense?: { licenseId?: string | null; name?: string | null } | null;
  repositoryMeta?: { latestVersion?: string | null } | null;
  externalReferences?: DtExternalReference[] | null;
  metrics?: DtComponentMetrics | null;
};

/** An entry of `/v1/finding/project/{uuid}`: one vulnerability in one component. */
export type DtFinding = {
  component: {
    uuid: string;
    name: string;
    group?: string | null;
    version?: string | null;
    purl?: string | null;
    latestVersion?: string | null;
  };
  vulnerability: {
    uuid: string;
    vulnId: string;
    /** E.g. `GITHUB`, `NVD` or `OSV`. */
    source: string;
    severity?: DtSeverity | null;
    /** Each entry maps an id type, e.g. `cveId`, to an id. */
    aliases?: Record<string, string>[] | null;
  };
  matrix: string;
};

/** Version range of a component affected by a vulnerability. */
export type DtAffectedComponent = {
  identityType?: string | null;
  /** Package URL without version, e.g. `pkg:maven/org.codehaus.plexus/plexus-utils`. */
  identity?: string | null;
  versionType?: "EXACT" | "RANGE" | null;
  version?: string | null;
  versionStartIncluding?: string | null;
  versionStartExcluding?: string | null;
  versionEndIncluding?: string | null;
  versionEndExcluding?: string | null;
};

export type DtVulnerability = {
  affectedComponents?: DtAffectedComponent[] | null;
};
