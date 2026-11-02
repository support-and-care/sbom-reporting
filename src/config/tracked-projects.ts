export type TrackedProjectDefinition = {
  slug: string;
  name: string;
  description: string;
  highlights: string;
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
    highlights: "Java · consensus node · SDKs",
    match: { purlNamespaces: ["org.hiero"], namePrefixes: ["hiero-"] },
  },
  {
    slug: "maven",
    name: "Maven",
    description: "Apache Maven — build system components",
    highlights: "maven-core · resolver · plugins",
    match: { purlNamespaces: ["org.apache.maven"], namePrefixes: ["maven"] },
  },
];
