import Link from "next/link";
import { SearchField } from "@/components/ui/SearchField";
import { routes, siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="flex min-h-24 flex-wrap items-center gap-x-18 gap-y-4 border-b border-neutral-200 bg-neutral-0 px-6 py-4 sm:px-15">
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
    </header>
  );
}
