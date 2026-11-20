# Contributing to aerostack2.org

Thanks for getting involved! This repository holds the Aerostack2 website and documentation. Problems with Aerostack2 itself belong in [aerostack2](https://github.com/aerostack2/aerostack2/issues), which has its own [contributing guide](https://github.com/aerostack2/aerostack2/blob/main/CONTRIBUTING.md).

## Propose new content before writing it

New pages, new sections and new features of the site start with an [issue](https://github.com/aerostack2/aerostack2.dev/issues). Agree on what they cover and where they fit before you write them. Pull requests for these changes without a prior agreement will be closed.

Typos, fixes and small improvements can go straight to a pull request.

## Setting up

Follow [Running it](README.md#running-it) in the README. Its `bun install` step also installs the git hooks.

## Commit messages

Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org), for example `fix(docs): correct the takeoff example`. The scope is optional.

## Local hooks

Running `bun install` sets up the git hooks with lefthook. On every commit Biome fixes the staged files and commitlint checks the message. To check everything by hand, run `bun run lint` and `bun run types:check`.

CI runs the lint, the type check, the build and commitlint on every push to `main` and every pull request.
