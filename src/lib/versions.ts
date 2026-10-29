const STABLE_VERSION = /^\d+(\.\d+)*$/;

function compareVersions(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

/**
 * The highest stable version (no qualifier such as `-rc-1`, `-beta-3` or
 * `-SNAPSHOT`), or the highest version if none is stable.
 */
export function latestVersion<T extends { version: string }>(
  versions: readonly T[],
): T | undefined {
  const stable = versions.filter((v) => STABLE_VERSION.test(v.version));
  const candidates = stable.length > 0 ? stable : versions;
  return candidates.reduce<T | undefined>(
    (latest, current) =>
      !latest || compareVersions(current.version, latest.version) > 0
        ? current
        : latest,
    undefined,
  );
}
