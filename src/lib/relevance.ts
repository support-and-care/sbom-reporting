/**
 * Search rank of a name for an already lower-cased query: exact matches (0)
 * first, then prefix matches (1), then everything else (2).
 */
export function relevance(name: string, query: string): number {
  const normalized = name.toLowerCase();
  if (normalized === query) return 0;
  if (normalized.startsWith(query)) return 1;
  return 2;
}
