import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { pageContainerStyles } from "@/components/layout/pageContainer";
import { ArtifactSearchForm } from "@/components/search/ArtifactSearchForm";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchResultsSkeleton } from "@/components/search/SearchResultsSkeleton";
import { getExampleArtifactName } from "@/lib/data/portfolio";
import { loadFromDt } from "@/lib/dt/client";
import { cn } from "@/lib/utils";
import { parseSearchParams, type SearchQuery } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Search",
};

function SearchLayout({
  query,
  children,
}: {
  query?: SearchQuery;
  children: ReactNode;
}) {
  return (
    <>
      <section className="flex flex-col items-center gap-6 bg-blue-50 px-5 py-16">
        <h1 className="font-display text-4xl font-bold tracking-display text-blue-700">
          Search artifacts
        </h1>
        <ArtifactSearchForm
          key={query?.q}
          defaultQuery={query?.q}
          className="max-w-160"
        />
      </section>
      <div className={cn(pageContainerStyles, "mt-16 mb-43")}>{children}</div>
    </>
  );
}

function SearchHint({ example }: { example?: string }) {
  return (
    <p className="text-xl text-neutral-700">
      Enter an artifact name{example && <>, for example {example},</>} to see
      its versions and known vulnerabilities.
    </p>
  );
}

/** The hint with a real tracked artifact as its example. */
async function SearchHintWithExample() {
  return <SearchHint example={await loadFromDt(getExampleArtifactName)} />;
}

async function SearchView({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const query = parseSearchParams(await searchParams);

  return (
    <SearchLayout query={query}>
      {query.q ? (
        <Suspense
          key={`${query.q}:${query.page}`}
          fallback={<SearchResultsSkeleton />}
        >
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <Suspense fallback={<SearchHint />}>
          <SearchHintWithExample />
        </Suspense>
      )}
    </SearchLayout>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense
      fallback={
        <SearchLayout>
          <SearchResultsSkeleton />
        </SearchLayout>
      }
    >
      <SearchView searchParams={searchParams} />
    </Suspense>
  );
}
