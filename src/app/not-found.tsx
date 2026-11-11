import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import Link from "next/link";
import { CrashArt } from "@/components/home/crash-art";
import { HomeFooter } from "@/components/home/footer";
import { Frame, Heading, Row } from "@/components/home/frame";
import { HomeNavbar } from "@/components/home/navbar";
import { getRepoStats } from "@/lib/github";
import { baseOptions } from "@/lib/layout.shared";

export const metadata: Metadata = { title: "Page not found" };

// The root not-found sits outside the (home) group, so it brings the home
// page's layout along itself.
export default async function NotFound() {
  const base = baseOptions();
  const repoStats = await getRepoStats();

  return (
    <HomeLayout
      {...base}
      nav={{ ...base.nav, component: <HomeNavbar repoStats={repoStats} /> }}
    >
      <main className="flex flex-1 flex-col">
        <Frame>
          <Row>
            <div className="flex flex-col items-center px-6 pt-20 pb-12 text-center sm:pt-28">
              <p className="font-mono text-xs tracking-widest text-fd-muted-foreground uppercase">
                Error 404 · Lost link
              </p>
              <Heading
                as="h1"
                className="mt-6 max-w-4xl text-5xl leading-[1.02] sm:text-7xl"
              >
                This page didn't make it.
              </Heading>
              <p className="mt-6 max-w-xl text-lg text-balance text-fd-muted-foreground">
                The link may be broken, or the page has moved. Head back and
                plan another flight.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="button button-primary h-10 min-w-36 px-5"
                >
                  Back home
                </Link>
                <Link
                  href="/docs"
                  className="button button-secondary h-10 min-w-36 px-5"
                >
                  Read the docs
                </Link>
              </div>
            </div>
            <CrashArt />
          </Row>
        </Frame>
        <HomeFooter />
      </main>
    </HomeLayout>
  );
}
