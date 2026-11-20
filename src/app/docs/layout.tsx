import { GithubInfo } from "fumadocs-ui/components/github-info";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsFooter } from "@/components/docs-footer";
import {
  AccordionFolder,
  SidebarAccordion,
  SidebarPageItem,
  SidebarSeparator,
} from "@/components/sidebar-accordion";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  type DocsVersionItem,
  VersionSelect,
} from "@/components/version-select";
import { getLatestPatches } from "@/lib/github";
import { baseOptions } from "@/lib/layout.shared";
import { projectRepo, upcomingDocsVersion } from "@/lib/shared";
import { getVersions, source } from "@/lib/source";

/**
 * The search trigger is styled to read as another sidebar section rather than
 * an inset box: flush to both edges, square, with the same rule beneath it that
 * separates the sections.
 *
 * `FullSearchTrigger` merges this over its own classes with a tailwind-aware
 * `cn`, so the conflicting utilities (`rounded-lg`, `border`, `bg-…`) are
 * overridden rather than fought with. The negative inline margin cancels the
 * `p-4` on the sidebar header that would otherwise inset it.
 *
 * `ps-*` rather than `px-*`: the default `ps-2` survives the merge and would
 * win over any `px-*` override on the start edge. The value lines the magnifier
 * up with the section icons, so it tracks `FOLDER_CLASS`'s `px-2` plus the
 * trigger's own 0.5rem indent.
 */
const SEARCH_CLASS =
  // `border-y` on top of `border-0` keeps the sides off while ruling the row
  // above and below, so it reads as a band between the logo and the sections.
  "order-2 -mx-4 rounded-none border-0 border-y border-fd-border bg-transparent" +
  // `-mb-2` cancels the `pb-2` on the sidebar header, closing the gap to the
  // first section.
  " ps-4 pe-2 py-2 -mb-2 hover:bg-fd-accent/50" +
  // Match the section rows: same `text-sm` label, same 1rem icon.
  " text-sm [&_svg]:size-4" +
  // The shortcut keycaps inherit the label size, which is too heavy for them.
  " [&_kbd]:text-[0.625rem] [&_kbd]:px-1 [&_kbd]:py-px";

/**
 * Ruled off from the footer controls above it and scaled down to sit closer to
 * the sidebar rows. `-mx-4 px-4` cancels the footer's own `p-4` so the rule —
 * and the hover state — reach both edges, matching the sections.
 *
 * The component stacks the repo name over the counts (`flex-col`); `flex-row`
 * plus `justify-between` puts the stars and forks on the right instead. The
 * name keeps its own `truncate`, so `shrink-0` on the counts makes the name
 * give way first when the sidebar is narrow.
 */
const GITHUB_INFO_CLASS =
  // `-mb-4` cancels the footer container's own `pb-4` so the card sits flush
  // with the bottom of the sidebar.
  // `h-10` matches the docs footer bar (src/components/docs-footer.tsx), so
  // the two line up along the bottom of the page.
  "-mx-4 px-4 h-10 py-0 mt-2 -mb-4 rounded-none border-t border-fd-border" +
  " flex-row items-center justify-between gap-2 [&>div]:shrink-0" +
  " text-[0.6875rem] [&_svg]:size-3 [&_div]:text-[0.625rem]";

/** The sidebar's version dropdown: main, then each release. */
async function versionItems(): Promise<DocsVersionItem[]> {
  const versions = getVersions();
  const patches = await getLatestPatches();
  const upcoming =
    upcomingDocsVersion && !versions.includes(upcomingDocsVersion)
      ? [
          {
            id: upcomingDocsVersion,
            title: `Version ${upcomingDocsVersion}`,
            detail: "Coming soon",
            url: "",
            disabled: true,
          },
        ]
      : [];
  return [
    { id: "main", title: "main", detail: "Unreleased", url: "/docs" },
    ...upcoming,
    ...versions.map((version) => ({
      id: version,
      title: `Version ${version}`,
      // Until its first tag is out, a release is its `.0`.
      detail: patches.get(version) ?? `${version}.0`,
      url: `/docs/${version}`,
    })),
  ];
}

export default async function Layout({ children }: LayoutProps<"/docs">) {
  const base = baseOptions();
  const versions = await versionItems();

  return (
    <SidebarAccordion>
      <DocsLayout
        tree={source.getPageTree()}
        // The built-in dropdown sits under the search; `VersionSelect` is ours.
        tabs={false}
        sidebar={{
          // The aside defaults to `bg-fd-card`, a step off the page. This
          // merges through a tailwind-aware `cn`, so it replaces that rather
          // than layering on it; the `border-e` still divides the two.
          //
          // The sidebar's grid area also covers the left gutter that opens
          // up past the layout width, and the aside fills it with its items
          // pushed to the end. Sizing it to the sidebar and aligning it to
          // the start pins it to the left edge of the screen instead. The
          // TOC is pinned to the right the same way (`[[...slug]]/page.tsx`).
          className: "bg-fd-background w-(--fd-sidebar-width) items-start",
          collapsible: false,
          banner: <VersionSelect versions={versions} />,
          components: {
            Folder: AccordionFolder,
            Item: SidebarPageItem,
            Separator: SidebarSeparator,
          },
          // Async server component. The counts refresh once a day; left at its
          // default of a minute, every docs page would regenerate that often.
          // `GITHUB_TOKEN` keeps it under GitHub's rate limit.
          footer: (
            <GithubInfo
              key="github"
              className={GITHUB_INFO_CLASS}
              owner={projectRepo.owner}
              repo={projectRepo.repo}
              token={process.env.GITHUB_TOKEN}
              fetchOptions={{ next: { revalidate: 86400 } }}
            />
          ),
        }}
        {...base}
        // The sidebar header renders `nav.children` straight after the title,
        // and the title carries `me-auto`, so this lands hard right of the logo.
        nav={{
          ...base.nav,
          children: <ThemeToggle key="theme" />,
        }}
        // Overrides after the spread, so this applies to the docs sidebar only
        // and the home navbar keeps both controls. The GitHub icon is redundant
        // with the repo card in the footer; `themeSwitch` stays off so the
        // switcher does not also reappear in the footer.
        githubUrl={undefined}
        themeSwitch={{ enabled: false }}
        searchToggle={{
          full: {
            className: SEARCH_CLASS,
          },
        }}
      >
        {children}
        <DocsFooter />
      </DocsLayout>
    </SidebarAccordion>
  );
}
