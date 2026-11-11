import { cache } from "react";

/**
 * The paper that introduces Aerostack2, how often it has been cited, and by
 * whom.
 *
 * Both come from Google Scholar through SerpApi, since Scholar has no API of
 * its own, and refresh once a month. They need `SERPAPI_API_KEY`. Without the
 * key, or when a request fails, the count falls back to `lastKnown` and the
 * list is left out, so a page never breaks over them.
 *
 * Each refresh spends one search on the count and one per 20 citing papers.
 */

export const paper = {
  title:
    "Aerostack2: A Software Framework for Developing Multi-robot Aerial Systems",
  authors: [
    "M. Fernandez-Cortizas",
    "M. Molina",
    "P. Arias-Perez",
    "R. Perez-Segui",
    "D. Perez-Saura",
    "P. Campoy",
  ],
  year: 2023,
  arxiv: "2303.18237",
  /** The paper's entry on Google Scholar, as `<author id>:<article id>`. */
  scholarId: "O_S8DW4AAAAJ:qjMakFHDy7sC",
};

const scholarUrl = `https://scholar.google.com/citations?view_op=view_citation&user=${paper.scholarId.split(":")[0]}&citation_for_view=${paper.scholarId}`;

/** Update this by hand now and then, for builds without the key. */
const lastKnown = { count: 75, date: "2026-11-02" };

/** Scholar lists 20 papers a page. This caps the searches one refresh spends. */
const MAX_PAGES = 10;

export interface Citations {
  count: number;
  /** Google Scholar's list of the citing papers, or the paper's entry. */
  link: string;
  /** Scholar's id for the list of citing papers, when it was fetched. */
  citesId?: string;
}

export interface CitingPaper {
  title: string;
  link?: string;
  /** Authors, venue and year, as Scholar writes them. */
  summary: string;
  year?: number;
  citedBy: number;
}

/**
 * Shared within one render, so the count and the list ask once. Across renders
 * and pages, Next's data cache holds the responses for a month. A module-level
 * cache would stop every page but the first from refreshing.
 */
export const getCitations = cache(fetchCitations);

/**
 * Every paper that cites Aerostack2, newest first, or null when they couldn't
 * be fetched.
 */
export const getCitingPapers = cache(fetchCitingPapers);

async function serpapi(params: Record<string, string>) {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) throw new Error("SERPAPI_API_KEY isn't set");
  const url = new URL("https://serpapi.com/search.json");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("api_key", key);
  // A month's cache. In production that's how often the citation pages
  // refresh, and in dev it saves spending searches on every restart.
  // SerpApi can hang; failing fast lets the build fall back.
  const response = await fetch(url, {
    next: { revalidate: 2592000 },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(String(data.error));
  return data;
}

/**
 * Falls back during a build, so a deploy never breaks. In a refresh on the
 * live site it throws instead, so Next keeps serving the last good page rather
 * than replacing it with the fallback for a month.
 */
function fail(what: string, error: unknown) {
  // Quiet when there's no key, which is the usual local setup.
  if (!process.env.SERPAPI_API_KEY) return;
  const building = process.env.NEXT_PHASE === "phase-production-build";
  if (!building && process.env.NODE_ENV === "production") throw error;
  console.warn(
    `[citations] ${what}:`,
    error instanceof Error ? error.message : error,
  );
}

async function fetchCitations(): Promise<Citations> {
  try {
    // The google_scholar_author engine hangs, so search for the title instead.
    const data = await serpapi({
      engine: "google_scholar",
      q: paper.title,
      hl: "en",
    });
    // biome-ignore lint/suspicious/noExplicitAny: SerpApi's JSON is untyped.
    const results: any[] = data?.organic_results ?? [];
    const match = results.find(
      (r) => r.title?.toLowerCase() === paper.title.toLowerCase(),
    );
    const citedBy = match?.inline_links?.cited_by;
    const count = Number(citedBy?.total);
    if (!Number.isFinite(count) || count <= 0) throw new Error("no count");
    const link = typeof citedBy.link === "string" ? citedBy.link : scholarUrl;
    const citesId = citedBy.cites_id ?? undefined;
    return { count, link, citesId };
  } catch (error) {
    fail(
      `Using the last known count, ${lastKnown.count} on ${lastKnown.date}`,
      error,
    );
    return { count: lastKnown.count, link: scholarUrl };
  }
}

async function fetchCitingPapers(): Promise<CitingPaper[] | null> {
  const { count, citesId } = await getCitations();
  if (!citesId) return null;

  try {
    const papers: CitingPaper[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await serpapi({
        engine: "google_scholar",
        cites: citesId,
        num: "20",
        start: String(page * 20),
        hl: "en",
      });
      const results: unknown[] = data?.organic_results ?? [];
      papers.push(...results.flatMap(toPaper));
      if (results.length < 20 || papers.length >= count) break;
    }
    return papers.sort(
      (a, b) => (b.year ?? 0) - (a.year ?? 0) || b.citedBy - a.citedBy,
    );
  } catch (error) {
    fail("Leaving the list of citing papers out", error);
    return null;
  }
}

// biome-ignore lint/suspicious/noExplicitAny: SerpApi's JSON is untyped.
function toPaper(result: any): CitingPaper[] {
  if (typeof result?.title !== "string") return [];
  const summary: string = result.publication_info?.summary ?? "";
  // "A Author, B Author - Venue, 2024 - publisher.com": the year is the last
  // four digits before the final dash.
  const year = summary.match(/\b(19|20)\d{2}\b(?!.*\b(19|20)\d{2}\b)/)?.[0];
  return [
    {
      title: result.title,
      link: typeof result.link === "string" ? result.link : undefined,
      summary,
      year: year ? Number(year) : undefined,
      citedBy: Number(result.inline_links?.cited_by?.total) || 0,
    },
  ];
}
