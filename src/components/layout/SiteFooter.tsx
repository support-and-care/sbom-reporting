import { pageContainerStyles } from "@/components/layout/pageContainer";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="bg-blue-900">
      <div
        className={cn(
          pageContainerStyles,
          "flex min-h-33 flex-col gap-5 pt-15 pb-5",
        )}
      >
        <p className="text-sm text-neutral-100">{siteConfig.tagline}</p>
        <ul className="flex text-xs text-blue-300">
          {siteConfig.footerLinks.map((link, index) => (
            <li key={link.href}>
              {index > 0 && <span aria-hidden> . </span>}
              <a href={link.href} className="hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
