import { createMDX } from "fumadocs-mdx/next";
import apiVersions from "./content/api-versions.json" with { type: "json" };

const withMDX = createMDX();

// Listed newest release first, so this is main only until a release is cut.
const latestApiVersion = Object.keys(apiVersions)[0];
const apiVersion = ":version(main|\\d+\\.\\d+)";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Room for the citations page's SerpApi requests.
  staticPageGenerationTimeout: 180,
  // Images are served as they are. The avatars already come from GitHub at the
  // size they're shown, and this keeps clear of Vercel's image quotas.
  images: {
    unoptimized: true,
  },
  // The generated API pages link relative to their URL, so theirs must keep the
  // slash. The default slash removal is off and re-created for everything else.
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      ...["cppdocs", "pydocs"].flatMap((docs) => [
        {
          source: `/${docs}`,
          destination: `/${docs}/${latestApiVersion}/`,
          permanent: false,
        },
        {
          // The lookahead stops this from also matching the slashed URL and looping.
          source: `/${docs}/:version((?:main|\\d+\\.\\d+)(?!/))`,
          destination: `/${docs}/:version/`,
          permanent: true,
        },
        {
          source: `/${docs}/${apiVersion}/index.html`,
          destination: `/${docs}/:version/`,
          permanent: true,
        },
      ]),
      {
        // Sphinx pages are folders, while a dot in the last segment means a file.
        source: `/pydocs/${apiVersion}/:page((?:[^/]+/)*[^./]+(?!/))`,
        destination: "/pydocs/:version/:page/",
        permanent: true,
      },
      {
        source: "/:path((?!(?:cppdocs|pydocs)(?:/|$)).+)/",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: `/cppdocs/${apiVersion}/`,
        destination: "/cppdocs/:version/index.html",
      },
      {
        source: `/pydocs/${apiVersion}/`,
        destination: "/pydocs/:version/index.html",
      },
      {
        source: `/pydocs/${apiVersion}/:page(.+)/`,
        destination: "/pydocs/:version/:page/index.html",
      },
    ];
  },
};

export default withMDX(config);
