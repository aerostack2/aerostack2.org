// Freezes the main docs as a release: `bun run docs:cut 2.1`.
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { isDocsVersion } from "../src/lib/shared";

const version = process.argv[2];
if (!version || !isDocsVersion(version)) {
  console.error("Usage: bun run docs:cut <major.minor>, e.g. 2.1");
  process.exit(1);
}

const root = "content/docs";
const dest = join(root, version);
if (existsSync(dest)) {
  console.error(`${dest} already exists`);
  process.exit(1);
}

for (const entry of readdirSync(root)) {
  if (isDocsVersion(entry)) continue;
  cpSync(join(root, entry), join(dest, entry), { recursive: true });
}

// Absolute links in the copy would otherwise lead back to main.
const docsLink = /(?<=[("'])\/docs(?=[/#)"'])/g;
for (const file of readdirSync(dest, { recursive: true, encoding: "utf8" })) {
  if (!file.endsWith(".mdx")) continue;
  const path = join(dest, file);
  writeFileSync(
    path,
    readFileSync(path, "utf8").replace(docsLink, `/docs/${version}`),
  );
}

const metaPath = join(dest, "meta.json");
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
writeFileSync(
  metaPath,
  `${JSON.stringify({ title: version, root: true, ...meta }, null, 2)}\n`,
);

console.log(`Cut ${dest}`);
