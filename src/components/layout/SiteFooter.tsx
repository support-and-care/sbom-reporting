import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="flex min-h-33 flex-col gap-5 bg-blue-900 px-6 pt-15 pb-5 sm:px-16">
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
    </footer>
  );
}
