/**
 * Type of a Package URL, e.g. `pkg:maven/org.apache.maven/maven@3.9.11` →
 * `maven`. `undefined` if the value is not a Package URL.
 */
export function purlType(purl: string | null | undefined): string | undefined {
  if (!purl?.startsWith("pkg:")) return undefined;
  const [type] = purl.slice("pkg:".length).split("/");
  return type ? type.toLowerCase() : undefined;
}

/**
 * Namespace of a Package URL, e.g.
 * `pkg:maven/org.apache.maven.plugins/maven-clean-plugin@3.5.0?type=maven-plugin`
 * → `org.apache.maven.plugins`. `undefined` if the purl has no namespace.
 */
export function purlNamespace(
  purl: string | null | undefined,
): string | undefined {
  if (!purl?.startsWith("pkg:")) return undefined;

  // Qualifiers (`?…`) and subpath (`#…`) may contain slashes, so drop them first.
  const [path] = purl.slice("pkg:".length).split(/[?#]/);
  const [typeNamespaceName] = path.split("@");
  const segments = typeNamespaceName.split("/").filter(Boolean);

  // type / namespace… / name
  if (segments.length < 3) return undefined;
  return segments.slice(1, -1).map(decodeURIComponent).join("/");
}

/**
 * A Package URL without version, qualifiers and subpath, e.g.
 * `pkg:maven/org.codehaus.plexus/plexus-utils@4.0.2?type=jar` →
 * `pkg:maven/org.codehaus.plexus/plexus-utils`, the form Dependency-Track
 * uses to identify the package an advisory affects.
 */
export function purlWithoutVersion(
  purl: string | null | undefined,
): string | undefined {
  if (!purl?.startsWith("pkg:")) return undefined;
  const [path] = purl.split(/[?#]/);
  const at = path.lastIndexOf("@");
  return at > path.indexOf("/") ? path.slice(0, at) : path;
}
