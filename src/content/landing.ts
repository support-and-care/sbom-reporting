// Static placeholder content until the Dependency-Track integration provides live data.

export type HowItWorksStep = {
  title: string;
  description: string;
};

export const snapshotDate = "2026-10-20";

export const sbomExplainerUrl = "#";

export const howItWorksSteps: HowItWorksStep[] = [
  { title: "1 · Pick a project", description: "or search an artifact" },
  { title: "2 · Open an artifact", description: "pick the version you use" },
  { title: "3 · Read or download", description: "vulns, deps, SBOM file" },
];
