/** How the project's homepage is presented among an artifact's external references. */
export type ProjectHomepage = {
  /** E.g. `Apache Maven`. */
  label: string;
  /** Logo shown on the link, if the project has one in `public/images`. */
  logo?: "apache-maven";
};

export type TrackedProjectDefinition = {
  slug: string;
  name: string;
  description: string;
  /** Shown under each artifact name on the project page. */
  artifactLabel: string;
  homepage: ProjectHomepage;
  /**
   * Dependency-Track has no notion of these projects, so artifacts are
   * assigned by Package URL namespace (including sub-namespaces) or, for
   * artifacts without a Package URL, by name prefix.
   */
  match: {
    purlNamespaces: string[];
    namePrefixes: string[];
  };
};

export const trackedProjects: TrackedProjectDefinition[] = [
  {
    slug: "hiero",
    name: "Hiero",
    description: "Open-source DLT — Hiero SDKs and services",
    artifactLabel: "Hiero artifact",
    homepage: { label: "Hiero" },
    match: { purlNamespaces: ["org.hiero"], namePrefixes: ["hiero-"] },
  },
  {
    slug: "maven",
    name: "Maven",
    description: "Apache Maven — build system components",
    artifactLabel: "Apache Maven artifact",
    homepage: { label: "Apache Maven", logo: "apache-maven" },
    match: { purlNamespaces: ["org.apache.maven"], namePrefixes: ["maven"] },
  },
];
