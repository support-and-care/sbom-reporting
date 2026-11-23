const STABLE_VERSION = /^\d+(\.\d+)*$/;

/** Whether a version is a release, without a qualifier such as `-SNAPSHOT`. */
export function isStableVersion(version: string): boolean {
  return STABLE_VERSION.test(version);
}

/** Orders versions numerically, so `3.10.0` sorts after `3.9.9`. */
export function compareVersions(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

/**
 * The highest stable version (no qualifier such as `-rc-1`, `-beta-3` or
 * `-SNAPSHOT`), or the highest version if none is stable.
 */
export function latestVersion<T extends { version: string }>(
  versions: readonly T[],
): T | undefined {
  const stable = versions.filter((v) => isStableVersion(v.version));
  const candidates = stable.length > 0 ? stable : versions;
  return candidates.reduce<T | undefined>(
    (latest, current) =>
      !latest || compareVersions(current.version, latest.version) > 0
        ? current
        : latest,
    undefined,
  );
}
