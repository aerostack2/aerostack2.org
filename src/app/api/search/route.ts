import { createFromSource } from "fumadocs-core/search/server";
import { getVersion, source } from "@/lib/source";

export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
  // Tagged by version so the dialog searches only the docs being read.
  buildIndex: (page) => ({
    id: page.url,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    structuredData: page.data.structuredData,
    tag: getVersion(page) ?? "main",
  }),
});
