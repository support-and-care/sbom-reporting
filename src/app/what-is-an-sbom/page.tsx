import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "What is an SBOM?",
  description:
    "A two-minute introduction to software bills of materials: what they contain, why they matter and how Release Prism uses them.",
};

const furtherReading = [
  { href: "https://cyclonedx.org", label: "CycloneDX" },
  { href: "https://spdx.dev", label: "SPDX" },
  { href: "https://dependencytrack.org", label: "OWASP Dependency-Track" },
  {
    href: "https://www.cisa.gov/sbom",
    label: "CISA: Software Bill of Materials",
  },
];

type ArticleSectionProps = {
  title: string;
  children: ReactNode;
};

function ArticleSection({ title, children }: ArticleSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function SbomExplainerPage() {
  return (
    <>
      <header className="flex flex-col items-center gap-4 bg-blue-50 px-5 py-16 text-center">
        <p className="text-base font-bold text-blue-800 uppercase">
          2-minute read
        </p>
        <h1 className="font-display text-4xl font-bold tracking-display text-blue-700 sm:text-5xl">
          What is an SBOM?
        </h1>
        <p className="max-w-180 text-xl tracking-display text-neutral-700 sm:text-2xl">
          A software bill of materials lists everything a piece of software is
          built from. Here is what that means and why it matters.
        </p>
      </header>

      <article className="mx-auto mt-16 mb-43 flex w-full max-w-180 flex-col gap-12 px-6 text-xl leading-relaxed">
        <ArticleSection title="An ingredients list for software">
          <p>
            Almost no software is written from scratch. A typical application
            pulls in dozens or hundreds of open-source libraries, and those
            libraries depend on others in turn. An SBOM is a machine-readable
            inventory of all of these components: the ones a project uses
            directly, and the transitive dependencies that come along with them.
          </p>
        </ArticleSection>

        <ArticleSection title="What it records">
          <p>For every component, an SBOM typically lists:</p>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            <li>its name and version</li>
            <li>
              a unique identifier, usually a Package URL such as{" "}
              <code className="rounded-md bg-neutral-50 px-1.5 py-0.5 text-base break-all">
                pkg:maven/org.apache.maven/maven-core@3.9.9
              </code>
            </li>
            <li>the license it is published under</li>
            <li>which other components it depends on</li>
          </ul>
        </ArticleSection>

        <ArticleSection title="Why it matters">
          <p>
            When a new vulnerability is published, the first question is: are we
            affected? Without an SBOM, answering it means digging through the
            build files of every project. With one, it is a lookup. The
            Log4Shell vulnerability in Log4j in 2021 made this painfully clear,
            and regulations such as the EU Cyber Resilience Act now require
            manufacturers to document the components of their products in an
            SBOM.
          </p>
        </ArticleSection>

        <ArticleSection title="Two common formats">
          <p>
            SBOMs are usually written in one of two open standards: CycloneDX,
            maintained by OWASP, and SPDX, maintained by the Linux Foundation
            and published as ISO/IEC 5962. Both are plain JSON or XML files that
            tools can read, compare and check automatically.
          </p>
        </ArticleSection>

        <section className="flex flex-col gap-4 rounded-3xl bg-blue-50 px-7 py-8">
          <h2 className="text-3xl font-semibold text-blue-800">
            How Release Prism uses them
          </h2>
          <p>
            Open Elements generates SBOMs for the open-source projects it tracks
            and analyzes them with OWASP Dependency-Track, which checks every
            component against public vulnerability databases. Release Prism
            shows the results as point-in-time snapshots: pick an artifact and a
            version to see its dependencies, licenses and known vulnerabilities,
            or download the SBOM file itself.
          </p>
          <Button
            asChild
            className="h-14 self-start rounded-pill px-8 text-xl font-bold hover:bg-blue-800"
          >
            <Link href="/#projects">Browse tracked projects</Link>
          </Button>
        </section>

        <ArticleSection title="Further reading">
          <ul className="flex flex-col gap-2">
            {furtherReading.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-blue-700 underline-offset-4 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </ArticleSection>
      </article>
    </>
  );
}
