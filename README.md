# aerostack2.dev

The website and documentation of [Aerostack2](https://github.com/aerostack2/aerostack2), an open
source framework for developing multi-robot aerial systems, built on ROS 2.

It's a [Next.js](https://nextjs.org) app built with [Fumadocs](https://fumadocs.dev), deployed on
Vercel.

## Running it

```bash
bun install
bun dev
```

Then open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `bun dev` | Starts the dev server |
| `bun run build` | Builds the site for production |
| `bun start` | Serves the production build |
| `bun run types:check` | Checks the types |
| `bun run lint` | Lints and checks formatting with Biome |
| `bun run docs:cut <version>` | Freezes the main docs as a release, see [Versions](#versions) |
| `bun run changelog` | Writes `CHANGELOG.md` from the commit history with git-cliff |

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), checked by
commitlint. `bun install` sets up the git hooks with lefthook: Biome fixes the staged files before
each commit and commitlint checks the message. CI runs the lint, the type check, the build and
commitlint on every push to `main` and every pull request.

## Versions

`content/docs` holds the docs for `main`, served at `/docs`. Each minor release is a frozen copy in `content/docs/<major.minor>`, served at `/docs/<major.minor>` with its own sidebar and search. Patch releases share their minor's docs.

| When | What to do |
| --- | --- |
| A minor or major release (2.1) | Run `bun run docs:cut 2.1`, set `upcomingDocsVersion` in `src/lib/shared.ts` to the next release (or `null`), and open a PR |
| A patch release (2.1.1) | Nothing, unless the patch changes something the docs cover. Then edit `content/docs/2.1` directly, and `content/docs` too when the change also applies to `main` |
| A fix to a release's docs | Edit its folder directly. Never copy pages from `main` again, since `main` may already document the next release |

`docs:cut` copies the main docs into `content/docs/<major.minor>`, points their absolute links at `/docs/<major.minor>` and gives the folder its own sidebar. It refuses anything but `major.minor` and an existing folder.

Links added to a release's pages by hand must start with `/docs/<major.minor>/`, or they lead to `main`. Relative links work in every folder.

The version selector lists `main`, `upcomingDocsVersion` as coming soon until its folder exists, and each release folder. A release's patch number is its newest tag on [aerostack2](https://github.com/aerostack2/aerostack2), refreshed once a day like the GitHub stats.

## Environment

Both variables are optional locally. Put them in `.env.local`, which git ignores.

| Variable | What it's for |
| --- | --- |
| `GITHUB_TOKEN` | The star and fork counts and the contributors, which take about fifty requests to the GitHub API. Without a token GitHub rate-limits them. `GITHUB_TOKEN=$(gh auth token)` works |
| `SERPAPI_API_KEY` | The citation count and the list of citing papers, from Google Scholar through [SerpApi](https://serpapi.com). Without it the count falls back to the last known one and the list links to Google Scholar |

GitHub data refreshes once a day and citations once a month, in production and in dev.

## Layout

| Path | What's there |
| --- | --- |
| `content/docs` | The documentation pages, in MDX |
| `src/app/(home)` | The home page |
| `src/app/docs` | The documentation layout and pages |
| `src/components` | Components, including the ones the MDX pages use, registered in `mdx.tsx` |
| `src/lib` | The content source, shared settings and the GitHub and citation data |
| `public` | Images and other static files |
