/** How long each featured package is shown before the next one. */
export const FEATURED_ROTATION_MS = 4_000;

/** Number of the rotation slot `time` falls into. */
export function featuredSlot(time: number): number {
  return Math.floor(time / FEATURED_ROTATION_MS);
}

/** Integer hash used as a deterministic source of randomness. */
function scramble(value: number): number {
  let hash = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** The candidates in the shuffled order of one round. */
function shuffledRound(round: number, count: number): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i--) {
    const j = scramble(round * count + i) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Index of the candidate featured during `slot`. Candidates are shown in
 * shuffled rounds, each exactly once per round, never twice in a row. The
 * pick depends only on the time, so everyone sees the same package at the
 * same moment and reloading within a slot keeps it.
 */
export function featuredIndex(slot: number, count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return slot & 1;

  const round = Math.floor(slot / count);
  const position = slot - round * count;
  const order = shuffledRound(round, count);
  // A round must not start with the package the previous one ended with.
  if (order[0] === shuffledRound(round - 1, count)[count - 1]) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order[position];
}
