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
