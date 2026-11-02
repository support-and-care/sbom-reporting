import { routes } from "@/config/site";

type RawSearchParams = Record<string, string | string[] | undefined>;

export const MAX_QUERY_LENGTH = 200;

export type SearchQuery = {
  q: string;
  page: number;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSearchParams(params: RawSearchParams): SearchQuery {
  const page = Number(firstValue(params.page));
  return {
    q: (firstValue(params.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function searchHref(query: SearchQuery): string {
  const params = new URLSearchParams({ q: query.q });
  if (query.page > 1) params.set("page", String(query.page));
  return `${routes.search}?${params}`;
}
