import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ArtifactSearchForm } from "@/components/search/ArtifactSearchForm";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchResultsSkeleton } from "@/components/search/SearchResultsSkeleton";
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
      <div className="mx-auto mt-16 mb-43 w-full max-w-288 px-6 xl:px-0">
        {children}
      </div>
    </>
  );
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
        <p className="text-xl text-neutral-700">
          Enter an artifact name, for example maven-core, to see its versions
          and known vulnerabilities.
        </p>
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
