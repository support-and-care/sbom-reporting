// Static landing page content and settings; report data comes from Dependency-Track (see `@/lib/data`).

export type HowItWorksStep = {
  title: string;
  description: string;
};

/** Artifact whose latest stable version is shown in the hero's package report. */
export const featuredArtifact = {
  name: "maven",
  purlNamespace: "org.apache.maven",
};

export const howItWorksSteps: HowItWorksStep[] = [
  { title: "1 · Pick a project", description: "or search an artifact" },
  { title: "2 · Open an artifact", description: "pick the version you use" },
  { title: "3 · Read or download", description: "vulns, deps, SBOM file" },
];
