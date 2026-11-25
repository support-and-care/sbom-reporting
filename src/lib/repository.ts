/** GitHub paths below `owner/repo` that are real pages, e.g. `tree/v1.0`. */
const GITHUB_PAGES = new Set([
  "tree",
  "blob",
  "commit",
  "commits",
  "releases",
  "tags",
]);

/** The URL if a browser can open it, i.e. it is http(s). */
export function webLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * A source repository link that opens in a browser, or `undefined` if the
 * URL is not http(s). Maven derives a module's repository URL by appending
 * the module name to its parent's, which yields broken links such as
 * `…/repo.git/module` or `https://github.com/google/guava/guava`; these are
 * cut back to the repository.
 */
export function repositoryLink(url: string | undefined): string | undefined {
  const link = webLink(url);
  if (!link) return undefined;

  const parsed = new URL(link);
  parsed.pathname = parsed.pathname.replace(/\.git(\/.*)?$/, "");

  if (["github.com", "www.github.com"].includes(parsed.hostname)) {
    const [owner, repo, page] = parsed.pathname.split("/").filter(Boolean);
    if (owner && repo && page && !GITHUB_PAGES.has(page)) {
      parsed.pathname = `/${owner}/${repo}`;
    }
  }
  return parsed.href;
}
