import { describe, expect, it } from "vitest";
import {
  activeFilters,
  mostAffectedArtifacts,
  pageItems,
  parseArtifactQuery,
  projectHref,
  queryArtifactDirectory,
  summarizeProject,
  toggleFilter,
  type ArtifactVersionEntry,
} from "./project-artifacts";

function entry(
  name: string,
  version: string,
  isLatest: boolean,
  [critical, high, medium, low] = [0, 0, 0, 0],
): ArtifactVersionEntry {
  return {
    uuid: `${name}@${version}`,
    name,
    version,
    isLatest,
    vulnerabilities: { critical, high, medium, low },
  };
}

const entries = [
  entry("maven-core", "3.9.9", true, [1, 2, 0, 0]),
  entry("maven-core", "3.9.10", false, [0, 0, 0, 0]),
  entry("maven-core", "3.8.1", false, [3, 4, 5, 0]),
  entry("maven-model", "3.9.9", true, [0, 0, 0, 0]),
  entry("maven-resolver", "1.9.0", true, [0, 0, 1, 2]),
];

const names = (items: ArtifactVersionEntry[]) =>
  items.map((item) => `${item.name}@${item.version}`);

describe("parseArtifactQuery", () => {
  it("defaults to relevance, page 1 and no filters", () => {
    expect(parseArtifactQuery({})).toEqual({
      q: "",
      sort: "relevance",
      page: 1,
      versions: [],
      severities: [],
      knownIssues: false,
    });
  });

  it("keeps only known filter values, in canonical order", () => {
    const query = parseArtifactQuery({
      version: ["older", "bogus", "latest", "older"],
      severity: ["none", "critical"],
      issues: "known",
      sort: "vulnerabilities",
    });
    expect(query.versions).toEqual(["latest", "older"]);
    expect(query.severities).toEqual(["critical", "none"]);
    expect(query.knownIssues).toBe(true);
    expect(query.sort).toBe("vulnerabilities");
  });

  it("falls back for invalid sort orders and pages", () => {
    const query = parseArtifactQuery({ sort: "random", page: "-1" });
    expect(query.sort).toBe("relevance");
    expect(query.page).toBe(1);
  });
});

describe("projectHref", () => {
  it("omits defaults and round-trips through parseArtifactQuery", () => {
    expect(projectHref("maven", parseArtifactQuery({}))).toBe(
      "/projects/maven",
    );

    const query = parseArtifactQuery({
      q: "core",
      version: "latest",
      severity: ["critical", "high"],
      page: "2",
    });
    const href = projectHref("maven", query);
    expect(href).toBe(
      "/projects/maven?q=core&version=latest&severity=critical&severity=high&page=2",
    );

    const params = new URLSearchParams(href.split("?")[1]);
    const raw = Object.fromEntries(
      [...new Set(params.keys())].map((key) => [key, params.getAll(key)]),
    );
    expect(parseArtifactQuery(raw)).toEqual(query);
  });
});

describe("toggleFilter", () => {
  it("adds and removes a filter and returns to the first page", () => {
    const query = { ...parseArtifactQuery({}), page: 3 };
    const added = toggleFilter(query, { kind: "severity", value: "high" });
    expect(added.severities).toEqual(["high"]);
    expect(added.page).toBe(1);
    expect(
      toggleFilter(added, { kind: "severity", value: "high" }).severities,
    ).toEqual([]);
  });

  it("lists active filters with severities first", () => {
    const query = parseArtifactQuery({
      version: "latest",
      severity: "critical",
      issues: "known",
    });
    expect(activeFilters(query).map((filter) => filter.kind)).toEqual([
      "severity",
      "version",
      "knownIssues",
    ]);
  });
});

describe("queryArtifactDirectory", () => {
  it("matches any option within a group and all groups together", () => {
    const query = parseArtifactQuery({
      version: "older",
      severity: ["critical", "medium"],
    });
    expect(names(queryArtifactDirectory(entries, query).items)).toEqual([
      "maven-core@3.8.1",
    ]);
  });

  it("filters versions without vulnerabilities with the None option", () => {
    const query = parseArtifactQuery({ severity: "none" });
    expect(names(queryArtifactDirectory(entries, query).items)).toEqual([
      "maven-model@3.9.9",
      "maven-core@3.9.10",
    ]);
  });

  it("counts facets over the search matches, ignoring the filters", () => {
    const query = parseArtifactQuery({ q: "core", severity: "critical" });
    const { facets, total } = queryArtifactDirectory(entries, query);
    expect(total).toBe(2);
    expect(facets.versions).toEqual({ latest: 1, older: 2 });
    expect(facets.severities.none).toBe(1);
    expect(facets.knownIssues).toBe(2);
  });

  it("puts latest versions first, then newest versions by default", () => {
    const { items } = queryArtifactDirectory(entries, parseArtifactQuery({}));
    expect(names(items)).toEqual([
      "maven-core@3.9.9",
      "maven-model@3.9.9",
      "maven-resolver@1.9.0",
      "maven-core@3.9.10",
      "maven-core@3.8.1",
    ]);
  });

  it("sorts by vulnerability count", () => {
    const query = parseArtifactQuery({ sort: "vulnerabilities" });
    expect(names(queryArtifactDirectory(entries, query).items)[0]).toBe(
      "maven-core@3.8.1",
    );
  });

  it("pages results and clamps pages past the end", () => {
    const query = parseArtifactQuery({ page: "9" });
    const page = queryArtifactDirectory(entries, query, 2);
    expect(page).toMatchObject({
      page: 3,
      pageCount: 3,
      firstIndex: 5,
      lastIndex: 5,
      total: 5,
    });
  });
});

describe("summarizeProject", () => {
  it("sums the latest version of every artifact", () => {
    expect(summarizeProject(entries)).toEqual({
      critical: 1,
      high: 2,
      medium: 1,
      low: 2,
      artifactCount: 3,
      artifactsWithKnownIssues: 2,
    });
  });
});

describe("mostAffectedArtifacts", () => {
  it("ranks latest versions with vulnerabilities by total", () => {
    expect(names(mostAffectedArtifacts(entries))).toEqual([
      "maven-core@3.9.9",
      "maven-resolver@1.9.0",
    ]);
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses gaps around the current page", () => {
    expect(pageItems(1, 248)).toEqual([1, 2, 3, 4, 5, 6, "ellipsis", 248]);
    expect(pageItems(50, 248)).toEqual([
      1,
      "ellipsis",
      48,
      49,
      50,
      51,
      52,
      "ellipsis",
      248,
    ]);
    expect(pageItems(247, 248)).toEqual([
      1,
      "ellipsis",
      243,
      244,
      245,
      246,
      247,
      248,
    ]);
  });
});
