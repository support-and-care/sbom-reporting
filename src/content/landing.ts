// Static placeholder content until the Dependency-Track integration provides live data.

export type TrackedProject = {
  slug: string;
  name: string;
  description: string;
  highlights: string;
  artifactCount: number;
};

export type HowItWorksStep = {
  title: string;
  description: string;
};

export const snapshotDate = "2026-10-20";

export const sbomExplainerUrl = "#";

export const trackedProjects: TrackedProject[] = [
  {
    slug: "hiero",
    name: "Hiero",
    description: "Open-source DLT — Hiero SDKs and services",
    highlights: "Java · consensus node · SDKs",
    artifactCount: 312,
  },
  {
    slug: "maven",
    name: "Maven",
    description: "Apache Maven — build system components",
    highlights: "maven-core · resolver · plugins",
    artifactCount: 1982,
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  { title: "1 · Pick a project", description: "or search an artifact" },
  { title: "2 · Open an artifact", description: "pick the version you use" },
  { title: "3 · Read or download", description: "vulns, deps, SBOM file" },
];
