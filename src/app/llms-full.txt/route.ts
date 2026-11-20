import { getLLMText, getVersion, source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  // Main only: every release would repeat the same pages.
  const scan = source
    .getPages()
    .filter((page) => !getVersion(page))
    .map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join("\n\n"));
}
