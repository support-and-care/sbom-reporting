import { describe, expect, it } from "vitest";
import { repositoryLink } from "./repository";

describe("repositoryLink", () => {
  it("cuts module names off GitHub repositories", () => {
    expect(repositoryLink("https://github.com/google/guava/guava")).toBe(
      "https://github.com/google/guava",
    );
    expect(
      repositoryLink(
        "https://github.com/hiero-ledger/hiero-enterprise-java.git/hiero-enterprise-spring",
      ),
    ).toBe("https://github.com/hiero-ledger/hiero-enterprise-java");
    expect(repositoryLink("https://github.com/x/y.git")).toBe(
      "https://github.com/x/y",
    );
  });

  it("keeps real GitHub pages and other hosts", () => {
    expect(
      repositoryLink(
        "https://github.com/apache/maven-scm/tree/maven-scm-2.2.1",
      ),
    ).toBe("https://github.com/apache/maven-scm/tree/maven-scm-2.2.1");
    expect(repositoryLink("https://github.com/apache/maven")).toBe(
      "https://github.com/apache/maven",
    );
    expect(
      repositoryLink("https://gitbox.apache.org/repos/asf?p=maven.git"),
    ).toBe("https://gitbox.apache.org/repos/asf?p=maven.git");
  });

  it("rejects links a browser cannot open", () => {
    expect(repositoryLink("scm:git:git@github.com:x/y.git")).toBeUndefined();
    expect(repositoryLink("git://github.com/x/y.git")).toBeUndefined();
    expect(repositoryLink("not a url")).toBeUndefined();
    expect(repositoryLink(undefined)).toBeUndefined();
  });
});
