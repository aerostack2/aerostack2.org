export const appName = "Aerostack2";
export const siteUrl = "https://aerostack2.org";
export const appDescription =
  "An open source framework for developing multi-robot aerial systems, built on ROS 2.";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "aerostack2",
  repo: "aerostack2.dev",
  branch: "main",
};

/** The framework itself, as opposed to this documentation site. */
export const projectRepo = {
  owner: "aerostack2",
  repo: "aerostack2",
};

/**
 * The strip under the home navbar. Set to `null` to hide it.
 */
export const news: { text: string; href: string } | null = {
  text: "The documentation has a new home. Start with the quickstart.",
  href: "/docs/getting-started/quickstart",
};

/**
 * A released docs version, frozen in `content/docs/<major.minor>`. The docs
 * outside those folders are `main`.
 */
export function isDocsVersion(segment: string | undefined): segment is string {
  return segment !== undefined && /^\d+\.\d+$/.test(segment);
}

/**
 * The next release, listed as "Coming soon" in the version dropdown until
 * `bun run docs:cut` creates its folder. Set to `null` to hide it.
 */
export const upcomingDocsVersion: string | null = "2.0";
