import "server-only";

type Entry<T> = { value: Promise<T>; expiresAt: number };

/**
 * In-memory cache for Dependency-Track reads that are expensive or repeated
 * on every page view. Concurrent callers share one request, failures are not
 * cached, and the oldest entries are dropped once `maxEntries` is reached.
 */
export function memoize<T>({
  ttlMs,
  maxEntries,
}: {
  ttlMs: number;
  maxEntries: number;
}) {
  const entries = new Map<string, Entry<T>>();

  return function cached(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = entries.get(key);
    if (hit && hit.expiresAt > now) return hit.value;

    const value = load();
    entries.delete(key);
    entries.set(key, { value, expiresAt: now + ttlMs });
    value.catch(() => {
      if (entries.get(key)?.value === value) entries.delete(key);
    });

    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
    return value;
  };
}
