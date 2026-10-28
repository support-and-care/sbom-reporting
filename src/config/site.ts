export type NavLink = {
  href: string;
  label: string;
};

export const routes = {
  home: "/",
  search: "/search",
  sbomExplainer: "/what-is-an-sbom",
  project: (slug: string) => `/projects/${slug}`,
};

export const siteConfig = {
  name: "Release Prism",
  description:
    "Dependency and vulnerability reports for the open-source projects Open Elements tracks.",
  tagline: "An Open Elements project · open source",
  navLinks: [
    { href: "/#projects", label: "Projects" },
    { href: "/#how-it-works", label: "About" },
  ] satisfies NavLink[],
  footerLinks: [
    {
      href: "https://github.com/support-and-care/sbom-reporting",
      label: "GitHub",
    },
    { href: "https://open-elements.com/impressum", label: "Imprint" },
    {
      href: "https://www.iubenda.com/privacy-policy/63821551",
      label: "Privacy",
    },
  ] satisfies NavLink[],
};
