"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  parseArtifactQuery,
  projectHref,
  type ArtifactQuery,
} from "@/lib/project-artifacts";

type QueryUpdate = {
  /** Replace the current history entry instead of adding one, e.g. while typing. */
  replace?: boolean;
};

function searchOf(href: string): string {
  return href.split("?")[1] ?? "";
}

function isCurrentUrl(search: string): boolean {
  return (
    typeof window === "undefined" ||
    new URLSearchParams(window.location.search).toString() === search
  );
}

/**
 * The artifact query, mirrored in the page URL so views are shareable and
 * back/forward work. Updates apply to state right away (no server request,
 * no flicker on controlled inputs) and are pushed to the URL; changes of the
 * URL from elsewhere, e.g. the back button, flow back into state.
 */
export function useArtifactQuery(slug: string) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const urlQuery = useMemo(() => {
    const params = new URLSearchParams(search);
    const raw: Record<string, string[]> = {};
    for (const key of new Set(params.keys())) raw[key] = params.getAll(key);
    return parseArtifactQuery(raw);
  }, [search]);

  const [current, setCurrent] = useState({ search, query: urlQuery });
  // Follow URL changes made elsewhere (back/forward, links). Next.js syncs
  // `useSearchParams` after our own pushes too, possibly after a newer push,
  // so only a value matching the address bar is adopted.
  if (current.search !== search && isCurrentUrl(search)) {
    setCurrent({ search, query: urlQuery });
  }

  function setQuery(
    next: ArtifactQuery,
    { replace = false }: QueryUpdate = {},
  ) {
    const href = projectHref(slug, next);
    setCurrent({ search: searchOf(href), query: next });
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
  }

  return [current.query, setQuery] as const;
}
