import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useId } from "react";
import type { ExternalLink } from "@/lib/data/artifact";

function Logo({ logo }: { logo: NonNullable<ExternalLink["logo"]> }) {
  switch (logo) {
    case "maven-central":
      return (
        <Image
          src="/images/artifact/maven-central.svg"
          alt=""
          width={97}
          height={26.6972}
        />
      );
    case "apache-maven":
      // Cropped like the design, which frames part of the source image.
      return (
        <span className="relative h-[39.188px] w-[102.7px] shrink-0 overflow-hidden">
          <Image
            src="/images/artifact/apache-maven.png"
            alt=""
            width={1439}
            height={706}
            sizes="117px"
            className="absolute top-[-24.14%] left-[-6.58%] h-[145.49%] w-[113.16%] max-w-none"
          />
        </span>
      );
    case "github":
      return (
        <Image
          src="/images/artifact/github.svg"
          alt=""
          width={32}
          height={32}
        />
      );
    case "advisories":
      return (
        <Image
          src="/images/artifact/advisories.svg"
          alt=""
          width={31.3493}
          height={36.2999}
        />
      );
  }
}

export function ExternalReferences({ links }: { links: ExternalLink[] }) {
  const titleId = useId();
  if (links.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2
          id={titleId}
          className="font-display text-[1.4375rem] font-bold text-neutral-800"
        >
          External references
        </h2>
        <p className="text-[0.9375rem] text-slate-500">
          Useful links for the artifact and its security information.
        </p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {links.map((link) => (
          <li key={link.title} className="flex">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-18 flex-1 items-center justify-between gap-4 rounded-md border border-neutral-200 px-4.5 py-3 hover:border-blue-700 hover:bg-blue-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[1.0625rem] font-bold text-blue-900">
                  {link.title}
                  <ArrowUpRight
                    aria-hidden
                    className="size-4"
                    strokeWidth={2.5}
                  />
                  <span className="sr-only"> (opens in a new tab)</span>
                </span>
                <span className="text-caption text-slate-500">
                  {link.description}
                </span>
              </span>
              {link.logo && <Logo logo={link.logo} />}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
