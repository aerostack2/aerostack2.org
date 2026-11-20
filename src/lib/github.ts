import { gitConfig, projectRepo } from "@/lib/shared";

/**
 * GitHub data for the home page, refreshed once a day: the repository's
 * star and fork counts (the navbar's GitHub card and the community section),
 * and the people behind the project (components/home/community.tsx).
 *
 * The maintainers are the code owners in the main repository's
 * .github/CODEOWNERS, plus Miguel Fernandez-Cortizas and Javier Melero, who
 * aren't listed there.
 * Names come from their GitHub profiles, or from the citation when a profile
 * has none.
 */
export const maintainers = [
  { login: "miferco97", name: "Miguel Fernandez-Cortizas" },
  { login: "RPS98", name: "Rafael Perez-Segui" },
  { login: "pariaspe", name: "Pedro Arias-Perez" },
  { login: "alvgaona", name: "Alvaro Gaona" },
  { login: "fjanguita", name: "Francisco Anguita" },
  { login: "rdasilva01", name: "Rodrigo Da Silva" },
  { login: "GPatiA2", name: "Guillermo García Patiño" },
  { login: "javilinos", name: "Javier Melero" },
];

/** Star and fork counts of the main repository. */
export interface RepoStats {
  stars: number;
  forks: number;
}

export type Contributor = {
  login: string;
  avatar: string;
  contributions: number;
};

export type Community = {
  contributors: Contributor[];
  repos: number;
};

/** Shared accounts and automation, which aren't people to credit. */
const skip = new Set(["cvar-developers"]);

type GitHubRepo = { name: string; fork: boolean; archived: boolean };
type GitHubContributor = {
  login: string;
  avatar_url: string;
  contributions: number;
  type: string;
};

async function github<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  // Cached for a day. In production that's how often the home page refreshes
  // it, and in dev it saves asking GitHub again on every reload.
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`GitHub ${path}: ${response.status}`);
  return response.json();
}

/**
 * The main repository's star and fork counts. On any failure it gives back
 * null and the counts are left out.
 */
export async function getRepoStats(): Promise<RepoStats | null> {
  try {
    const data = await github<{
      stargazers_count: number;
      forks_count: number;
    }>(`repos/${projectRepo.owner}/${projectRepo.repo}`);
    return { stars: data.stargazers_count, forks: data.forks_count };
  } catch {
    return null;
  }
}

/**
 * Everyone who has contributed to the organization's active repositories,
 * forks and archived ones left out, with their contributions summed across
 * repositories and the most active first.
 *
 * It makes one request per repository, about fifty, so it needs
 * `GITHUB_TOKEN` to stay under the rate limit. On any failure it gives back
 * nothing and the section leaves the contributors out.
 */
export async function getCommunity(): Promise<Community> {
  try {
    const repos = (
      await github<GitHubRepo[]>(`orgs/${projectRepo.owner}/repos?per_page=100`)
    ).filter((repo) => !repo.fork && !repo.archived);
    const lists = await Promise.all(
      repos.map((repo) =>
        github<GitHubContributor[]>(
          `repos/${projectRepo.owner}/${repo.name}/contributors?per_page=100`,
        ).catch(() => []),
      ),
    );
    const people = new Map<string, Contributor>();
    for (const person of lists.flat()) {
      if (person.type !== "User" || skip.has(person.login)) continue;
      const seen = people.get(person.login);
      if (seen) seen.contributions += person.contributions;
      else
        people.set(person.login, {
          login: person.login,
          avatar: person.avatar_url,
          contributions: person.contributions,
        });
    }
    return {
      contributors: [...people.values()].sort(
        (a, b) => b.contributions - a.contributions,
      ),
      repos: repos.length,
    };
  } catch {
    return { contributors: [], repos: 0 };
  }
}

type GitHubCommit = {
  author: { login: string; avatar_url: string; type: string } | null;
};

/**
 * Everyone who has committed to a docs page, the most commits first, from
 * the site repository's history on GitHub. `path` is relative to
 * `content/docs`.
 *
 * Commits whose email isn't linked to a GitHub account have no author and are
 * left out, as are bots. GitHub doesn't follow renames, so a moved page only
 * credits commits made since the move. On any failure it gives back nothing
 * and the page shows no avatars.
 */
export async function getPageContributors(
  path: string,
): Promise<Contributor[]> {
  try {
    const commits = await github<GitHubCommit[]>(
      `repos/${gitConfig.user}/${gitConfig.repo}/commits?path=${encodeURIComponent(`content/docs/${path}`)}&per_page=100`,
    );
    const people = new Map<string, Contributor>();
    for (const { author } of commits) {
      if (author?.type !== "User" || skip.has(author.login)) continue;
      const seen = people.get(author.login);
      if (seen) seen.contributions += 1;
      else
        people.set(author.login, {
          login: author.login,
          avatar: author.avatar_url,
          contributions: 1,
        });
    }
    return [...people.values()].sort(
      (a, b) => b.contributions - a.contributions,
    );
  } catch {
    return [];
  }
}

/**
 * The newest patch tag of each `major.minor`, e.g. `{ "2.0": "2.0.3" }`.
 * On any failure it gives back an empty map and the patch is left out.
 */
export async function getLatestPatches(): Promise<Map<string, string>> {
  const latest = new Map<string, string>();
  try {
    const tags = await github<{ name: string }[]>(
      `repos/${projectRepo.owner}/${projectRepo.repo}/tags?per_page=100`,
    );
    for (const { name } of tags) {
      const match = /^v?(\d+\.\d+)\.\d+$/.exec(name);
      if (!match) continue;
      const version = name.replace(/^v/, "");
      const seen = latest.get(match[1]);
      if (
        !seen ||
        version.localeCompare(seen, undefined, { numeric: true }) > 0
      )
        latest.set(match[1], version);
    }
  } catch {}
  return latest;
}

/** A GitHub avatar at `size` pixels, doubled for sharp screens. */
export const avatarAt = (url: string, size: number) =>
  `${url}${url.includes("?") ? "&" : "?"}s=${size * 2}`;

/** Where people leave their reviews: a discussion on the old site's repository. */
export const reviewsDiscussion = {
  owner: "aerostack2",
  repo: "aerostack2.github.io",
  number: 97,
  url: "https://github.com/aerostack2/aerostack2.github.io/discussions/97",
};

export type Review = {
  login: string;
  name: string | null;
  avatar: string;
  profile: string;
  url: string;
  date: string;
  /** The review's paragraphs, as plain text. */
  paragraphs: string[];
};

type ReviewsResponse = {
  data?: {
    repository: {
      discussion: {
        comments: {
          nodes: {
            author: {
              login: string;
              avatarUrl: string;
              url: string;
              name?: string | null;
            } | null;
            bodyText: string;
            createdAt: string;
            isMinimized: boolean;
            url: string;
          }[];
        };
      } | null;
    };
  };
};

/**
 * The user reviews, oldest first: the comments on the reviews discussion,
 * hidden ones left out. GitHub's GraphQL API needs a token, so without
 * `GITHUB_TOKEN`, or on any failure, it gives back null and the page just
 * links to the discussion.
 */
export async function getReviews(): Promise<Review[] | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const { owner, repo, number } = reviewsDiscussion;
  const query = `{
    repository(owner: "${owner}", name: "${repo}") {
      discussion(number: ${number}) {
        comments(first: 100) {
          nodes {
            author { login avatarUrl url ... on User { name } }
            bodyText
            createdAt
            isMinimized
            url
          }
        }
      }
    }
  }`;
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query }),
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const { data } = (await response.json()) as ReviewsResponse;
    const comments = data?.repository.discussion?.comments.nodes;
    if (!comments) return null;
    return comments.flatMap((comment) =>
      comment.isMinimized || !comment.author
        ? []
        : [
            {
              login: comment.author.login,
              name: comment.author.name || null,
              avatar: comment.author.avatarUrl,
              profile: comment.author.url,
              url: comment.url,
              date: comment.createdAt,
              paragraphs: comment.bodyText
                .split(/\n\s*\n|\n/)
                .map((line) => line.trim())
                .filter(Boolean),
            },
          ],
    );
  } catch {
    return null;
  }
}
