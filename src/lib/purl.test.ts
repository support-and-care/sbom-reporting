import { describe, expect, it } from "vitest";
import { purlNamespace } from "./purl";

describe("purlNamespace", () => {
  it("returns the namespace of a Maven purl", () => {
    expect(
      purlNamespace(
        "pkg:maven/org.apache.maven.plugins/maven-clean-plugin@3.5.0?type=maven-plugin",
      ),
    ).toBe("org.apache.maven.plugins");
  });

  it("ignores slashes in qualifiers", () => {
    expect(
      purlNamespace(
        "pkg:maven/org.hiero/hiero-enterprise-base@0.22.0?repository_url=https://repo.example/maven",
      ),
    ).toBe("org.hiero");
  });

  it("decodes percent-encoded namespaces", () => {
    expect(purlNamespace("pkg:npm/%40angular/core@17.0.0")).toBe("@angular");
  });

  it("returns undefined when there is no namespace or no purl", () => {
    expect(purlNamespace("pkg:pypi/requests@2.31.0")).toBeUndefined();
    expect(purlNamespace("not-a-purl")).toBeUndefined();
    expect(purlNamespace(null)).toBeUndefined();
  });
});
