/** Subset of the Dependency-Track v1 REST API response shapes used by this app. */

export type DtProjectMetrics = {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
};

export type DtConciseProject = {
  uuid: string;
  name: string;
  group?: string | null;
  version?: string | null;
  metrics?: DtProjectMetrics | null;
};

export type DtProject = {
  uuid: string;
  name: string;
  group?: string | null;
  purl?: string | null;
};
