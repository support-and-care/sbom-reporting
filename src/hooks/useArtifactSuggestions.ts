"use client";

import { useEffect, useState } from "react";
import { routes } from "@/config/site";
import {
  MIN_SUGGESTION_QUERY_LENGTH,
  type ArtifactSuggestion,
  type SuggestionsResponse,
} from "@/lib/suggestions";

const DEBOUNCE_MS = 200;

type LoadedSuggestions = {
  query: string;
  suggestions: ArtifactSuggestion[];
};

/**
 * Suggestions for the given search text, fetched after the user pauses typing.
 * While a newer query loads, the previous suggestions stay visible.
 */
export function useArtifactSuggestions(text: string, enabled: boolean) {
  const query = text.trim();
  const isActive = enabled && query.length >= MIN_SUGGESTION_QUERY_LENGTH;
  const [loaded, setLoaded] = useState<LoadedSuggestions>({
    query: "",
    suggestions: [],
  });

  useEffect(() => {
    if (!isActive) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${routes.searchSuggestions}?${new URLSearchParams({ q: query })}`,
          { signal: controller.signal },
        );
        const body: SuggestionsResponse = response.ok
          ? await response.json()
          : { suggestions: [] };
        setLoaded({ query, suggestions: body.suggestions });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[search] Loading suggestions failed:", error);
        setLoaded({ query, suggestions: [] });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isActive, query]);

  return {
    isActive,
    suggestions: isActive ? loaded.suggestions : [],
    isLoading: isActive && loaded.query !== query,
  };
}
