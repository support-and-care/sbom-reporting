import "server-only";

import { connection } from "next/server";

const TIMEOUT_MS = 15_000;
const PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 10;

type QueryValue = string | number | boolean | null | undefined;

class DtApiError extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(`Dependency-Track API request failed: ${endpoint} (${status})`);
    this.name = "DtApiError";
  }
}

class DtConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DtConfigError";
  }
}

type DtResponse<T> = {
  data: T;
  /** Value of `X-Total-Count`, present on paginated endpoints. */
  total: number | null;
};

function config() {
  const baseUrl = process.env.DT_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.DT_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new DtConfigError(
      "DT_API_URL and DT_API_KEY must be set (see .env.example).",
    );
  }
  return { baseUrl, apiKey };
}

/**
 * Performs an authenticated GET against the Dependency-Track REST API.
 * The API key is read from the environment and never sent to the browser.
 */
async function dtGet<T>(
  path: string,
  query: Record<string, QueryValue> = {},
): Promise<DtResponse<T>> {
  // Report data is read at request time, never baked in at build time.
  await connection();
  const { baseUrl, apiKey } = config();

  const url = new URL(`${baseUrl}/api${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "X-Api-Key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`[dependency-track] GET ${url.pathname} failed:`, error);
    throw new DtApiError(0, url.pathname);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[dependency-track] GET ${url.pathname}${url.search} -> ${response.status}`,
      body.slice(0, 500),
    );
    throw new DtApiError(response.status, url.pathname);
  }

  const total = response.headers.get("X-Total-Count");
  const text = await response.text();
  let data: T;
  try {
    data = (text ? JSON.parse(text) : null) as T;
  } catch (error) {
    console.error(
      `[dependency-track] GET ${url.pathname} returned invalid JSON:`,
      error,
    );
    throw new DtApiError(response.status, url.pathname);
  }
  return { data, total: total === null ? null : Number(total) };
}

/**
 * Fetches every page of a paginated endpoint, up to `maxPages` pages of
 * `PAGE_SIZE` items. Dependency-Track only paginates when both `pageNumber`
 * and `pageSize` are sent.
 */
export async function dtGetAll<T>(
  path: string,
  query: Record<string, QueryValue> = {},
  { maxPages = DEFAULT_MAX_PAGES }: { maxPages?: number } = {},
): Promise<{ items: T[]; truncated: boolean }> {
  const fetchPage = (pageNumber: number) =>
    dtGet<T[]>(path, { ...query, pageNumber, pageSize: PAGE_SIZE });

  const first = await fetchPage(1);
  const total = first.total ?? first.data?.length ?? 0;
  const pageCount = Math.min(Math.ceil(total / PAGE_SIZE), maxPages);
  const rest = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
      fetchPage(index + 2),
    ),
  );
  const items = [first, ...rest].flatMap((response) => response.data ?? []);
  return { items, truncated: total > items.length };
}

/**
 * Runs a Dependency-Track read and returns `undefined` when the API is not
 * configured or unavailable, so pages can show a fallback instead of failing.
 */
export async function loadFromDt<T>(
  load: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof DtConfigError) {
      console.error(`[dependency-track] ${error.message}`);
      return undefined;
    }
    if (error instanceof DtApiError) return undefined;
    throw error;
  }
}
