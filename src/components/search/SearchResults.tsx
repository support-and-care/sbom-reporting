import Link from "next/link";
import type { ReactNode } from "react";
import { ArtifactResult } from "@/components/search/ArtifactResult";
import { Button } from "@/components/ui/button";
import { artifactKey, searchArtifacts } from "@/lib/data/artifacts";
import { loadFromDt } from "@/lib/dt/client";
import { formatNumber } from "@/lib/format";
import { searchHref, type SearchQuery } from "@/lib/search-params";

function Message({ children }: { children: ReactNode }) {
  return <p className="text-xl text-neutral-700">{children}</p>;
}

type SearchResultsProps = {
  query: SearchQuery;
};

export async function SearchResults({ query }: SearchResultsProps) {
  const results = await loadFromDt(() => searchArtifacts(query.q, query.page));

  if (!results) {
    return (
      <Message>
        Search is unavailable right now. Please try again later.
      </Message>
    );
  }

  if (results.totalArtifacts === 0) {
    return <Message>No artifacts match &ldquo;{query.q}&rdquo;.</Message>;
  }

  const artifacts = `${formatNumber(results.totalArtifacts)} ${
    results.totalArtifacts === 1 ? "artifact matches" : "artifacts match"
  }`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xl">
          {artifacts} &ldquo;{query.q}&rdquo;
        </p>
        {results.truncated && (
          <p className="text-base text-neutral-600">
            Only the first matches are shown. Refine your search to narrow it
            down.
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {results.items.map((artifact) => (
          <li key={artifactKey(artifact)}>
            <ArtifactResult artifact={artifact} />
          </li>
        ))}
      </ul>

      {results.pageCount > 1 && (
        <nav
          aria-label="Search results pages"
          className="flex items-center justify-between gap-4"
        >
          <PageLink
            query={query}
            page={results.page - 1}
            label="Previous"
            disabled={results.page <= 1}
          />
          <p className="text-base text-neutral-700">
            Page {results.page} of {results.pageCount}
          </p>
          <PageLink
            query={query}
            page={results.page + 1}
            label="Next"
            disabled={results.page >= results.pageCount}
          />
        </nav>
      )}
    </div>
  );
}

type PageLinkProps = {
  query: SearchQuery;
  page: number;
  label: string;
  disabled: boolean;
};

function PageLink({ query, page, label, disabled }: PageLinkProps) {
  if (disabled) {
    return (
      <Button variant="outline" size="lg" disabled className="rounded-pill">
        {label}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="lg" asChild className="rounded-pill">
      <Link href={searchHref({ ...query, page })}>{label}</Link>
    </Button>
  );
}
