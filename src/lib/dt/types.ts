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
