import Link from "next/link";
import { pageContainerStyles } from "@/components/layout/pageContainer";
import { SearchField } from "@/components/ui/SearchField";
import { routes, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-neutral-0">
      <div
        className={cn(
          pageContainerStyles,
          "flex min-h-24 flex-wrap items-center gap-x-18 gap-y-4 py-4",
        )}
      >
        <Link href={routes.home} className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-15 shrink-0 rounded-2xl bg-blue-900"
          />
          <span className="text-2xl font-extrabold whitespace-nowrap uppercase">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-8">
          {siteConfig.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xl font-semibold hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form role="search" action={routes.search} className="sm:ml-auto">
          <SearchField
            label="Search artifacts"
            placeholder="search..."
            size="compact"
            className="w-46"
          />
        </form>
      </div>
    </header>
  );
}
