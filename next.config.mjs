import { createMDX } from "fumadocs-mdx/next";
import cppdocsVersions from "./content/cppdocs/versions.json" with {
  type: "json",
};

const withMDX = createMDX();

// Listed newest release first, so this is main only until a release is cut.
const latestCppdocs = Object.keys(cppdocsVersions)[0];
const cppdocsVersion = ":version(main|\\d+\\.\\d+)";

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
  // Doxygen's relative links need /cppdocs/<version>/ to keep its slash, so the
  // default slash removal is turned off and re-created for everything else.
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      {
        source: "/cppdocs",
        destination: `/cppdocs/${latestCppdocs}/`,
        permanent: false,
      },
      {
        // The lookahead stops this from also matching the slashed URL and looping.
        source: "/cppdocs/:version((?:main|\\d+\\.\\d+)(?!/))",
        destination: "/cppdocs/:version/",
        permanent: true,
      },
      {
        source: `/cppdocs/${cppdocsVersion}/index.html`,
        destination: "/cppdocs/:version/",
        permanent: true,
      },
      {
        source: "/:path((?!cppdocs(?:/|$)).+)/",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: `/cppdocs/${cppdocsVersion}/`,
        destination: "/cppdocs/:version/index.html",
      },
    ];
  },
};

export default withMDX(config);
