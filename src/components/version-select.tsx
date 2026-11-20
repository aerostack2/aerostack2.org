"use client";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isDocsVersion } from "@/lib/shared";

export type DocsVersionItem = {
  /** `main`, or the release's `major.minor`. */
  id: string;
  title: string;
  detail?: string;
  url: string;
  /** Listed but not linked, for a release that isn't out yet. */
  disabled?: boolean;
};

/**
 * A band between the logo and the search, ruled like the search trigger.
 * `order-1` lifts it above the search (`order-2` in `SEARCH_CLASS`), since
 * DocsLayout renders the sidebar banner after it.
 */
const TRIGGER_CLASS =
  "order-1 -mx-4 -mb-3 flex items-center gap-2 border-t border-fd-border" +
  " px-4 py-2 text-start cursor-pointer transition-colors" +
  " hover:bg-fd-accent/50 data-[popup-open]:bg-fd-accent/50";

/**
 * Fumadocs' popup look, flush with the band. Rows are padded so their text
 * lines up with the trigger's 1rem: 1px border, `p-1`, then 11px.
 */
const POPUP_CLASS =
  "flex w-(--anchor-width) flex-col gap-1 rounded-xl border bg-fd-popover/60" +
  " p-1 text-sm text-fd-popover-foreground shadow-lg backdrop-blur-lg" +
  " max-h-(--available-height) overflow-y-auto focus-visible:outline-none" +
  " data-closed:animate-fd-popover-out data-open:animate-fd-popover-in" +
  " origin-(--transform-origin)";

const ROW_CLASS = "flex items-center gap-2 rounded-lg px-[11px] py-1.5";

export function VersionSelect({ versions }: { versions: DocsVersionItem[] }) {
  const [open, setOpen] = useState(false);
  const [, , segment] = usePathname().split("/");
  const activeId = isDocsVersion(segment) ? segment : "main";
  const active = versions.find((v) => v.id === activeId) ?? versions[0];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={TRIGGER_CLASS}>
        <div className="min-w-0">
          <p className="text-sm font-medium">{active.title}</p>
          {active.detail && (
            <p className="text-xs text-fd-muted-foreground">{active.detail}</p>
          )}
        </div>
        <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
      </Popover.Trigger>
      {/* Base UI directly: Fumadocs' `PopoverContent` keeps the default
          collision padding, which nudges a full-width popup off the screen
          edge. */}
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={0}
          className="z-50"
        >
          <Popover.Popup className={POPUP_CLASS}>
            {versions.map((version) => {
              const content = (
                <>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {version.title}
                    </p>
                    {version.detail && (
                      <p className="mt-1 text-[0.8125rem] text-fd-muted-foreground">
                        {version.detail}
                      </p>
                    )}
                  </div>
                  <Check
                    className={`ms-auto size-3.5 shrink-0 text-fd-primary ${version.id === active.id ? "" : "invisible"}`}
                  />
                </>
              );
              return version.disabled ? (
                <div
                  key={version.id}
                  aria-disabled
                  className={`${ROW_CLASS} cursor-not-allowed opacity-50`}
                >
                  {content}
                </div>
              ) : (
                <Link
                  key={version.id}
                  href={version.url}
                  onClick={() => setOpen(false)}
                  className={`${ROW_CLASS} hover:bg-fd-accent hover:text-fd-accent-foreground`}
                >
                  {content}
                </Link>
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
