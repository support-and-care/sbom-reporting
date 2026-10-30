import type { NextRequest } from "next/server";
import { suggestArtifacts } from "@/lib/data/artifacts";
import { loadFromDt } from "@/lib/dt/client";
import { MAX_QUERY_LENGTH } from "@/lib/search-params";
import {
  MAX_SUGGESTIONS,
  MIN_SUGGESTION_QUERY_LENGTH,
  type SuggestionsResponse,
} from "@/lib/suggestions";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  if (query.length < MIN_SUGGESTION_QUERY_LENGTH) {
    return Response.json({ suggestions: [] } satisfies SuggestionsResponse);
  }

  const suggestions = await loadFromDt(() =>
    suggestArtifacts(query, MAX_SUGGESTIONS),
  );
  if (!suggestions) {
    return Response.json({ suggestions: [] } satisfies SuggestionsResponse, {
      status: 503,
    });
  }
  return Response.json({ suggestions } satisfies SuggestionsResponse);
}
